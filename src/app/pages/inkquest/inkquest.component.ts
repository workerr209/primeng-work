import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, of, Subscription } from 'rxjs';

import { InkquestService } from '../../services/inkquest.service';
import { Chapter, DailyEntry, DashboardSummary, Project, buildInkquestSummaryProgress, resolveProjectWordsGoal } from '../../models/inkquest.models';
import { appProperties } from '../../../app.properties';

import { InkquestRingsComponent } from './components/inkquest-rings/inkquest-rings.component';
import { InkquestPlotProgressComponent } from './components/inkquest-plot-progress/inkquest-plot-progress.component';
import { InkquestHeatmapComponent } from './components/inkquest-heatmap/inkquest-heatmap.component';
import { InkquestEntryDialogComponent } from './components/inkquest-entry-dialog/inkquest-entry-dialog.component';
import { InkquestStatsComponent } from './stats/stats.component';

type PageState = 'loading' | 'empty' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        SkeletonModule,
        ToastModule,
        InkquestRingsComponent,
        InkquestPlotProgressComponent,
        InkquestHeatmapComponent,
        InkquestEntryDialogComponent,
        InkquestStatsComponent
    ],
    providers: [MessageService],
    templateUrl: './inkquest.component.html',
    styleUrls: ['./inkquest.component.scss']
})
export class InkquestComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    showSkeleton = false;
    summary: DashboardSummary | null = null;
    chapters: Chapter[] = [];
    projects: Project[] = [];
    todayEntries: DailyEntry[] = [];
    todayEntriesByProject: Record<string, DailyEntry[]> = {};
    projectChapters: Record<string, Chapter[]> = {};
    todayProgressMode: 'summary' | 'project' = 'summary';
    selectedTodayProjectId?: string;

    showEntryDialog = false;
    entryDialogDate?: string;
    entryDialogProjectId?: string;
    entryDialogChapterId?: string;

    private sub?: Subscription;
    private chapterSub?: Subscription;
    private loadingTimer?: ReturnType<typeof setTimeout>;

    constructor(
        private service: InkquestService,
        private router: Router,
        private messageService: MessageService
    ) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.startLoading();
        this.sub?.unsubscribe();
        const today = this.localDate(new Date());
        this.sub = this.service.searchProjects().subscribe({
            next: projects => {
                const projectRequests = (projects ?? []).map(project => this.service.searchChapters(project.id));
                const projectEntryRequests = (projects ?? []).map(project => this.service.searchEntries({ date: today, projectId: project.id }));
                forkJoin([
                    this.service.getDashboard(),
                    this.service.searchEntries({ date: today }),
                    projectRequests.length ? forkJoin(projectRequests) : of([] as Chapter[][]),
                    projectEntryRequests.length ? forkJoin(projectEntryRequests) : of([] as DailyEntry[][])
                ]).subscribe({
                    next: ([summary, todayEntries, chapterGroups, projectEntryGroups]) => {
                        this.stopLoading();
                        this.summary = summary;
                        this.projects = projects ?? [];
                        this.todayEntriesByProject = this.toProjectEntriesMap(this.projects, projectEntryGroups as DailyEntry[][]);
                        this.todayEntries = this.mergeTodayEntries(todayEntries ?? [], this.todayEntriesByProject);
                        this.projectChapters = this.toProjectChaptersMap(this.projects, chapterGroups as Chapter[][]);
                        if (!summary) { this.state = 'empty'; return; }
                        this.ensureSelectedTodayProject(summary);
                        this.loadStoryChapters();
                        this.state = this.isEmpty(summary) ? 'empty' : 'loaded';
                    },
                    error: () => {
                        this.stopLoading();
                        this.state = 'error';
                    }
                });
            },
            error: () => {
                this.stopLoading();
                this.state = 'error';
            }
        });
    }

    private startLoading(): void {
        this.state = 'loading';
        this.showSkeleton = false;
        clearTimeout(this.loadingTimer);
        this.loadingTimer = setTimeout(() => {
            if (this.state === 'loading') this.showSkeleton = true;
        }, 250);
    }

    private stopLoading(): void {
        clearTimeout(this.loadingTimer);
        this.showSkeleton = false;
    }

    private isEmpty(s: DashboardSummary): boolean {
        return !s.currentProject && s.wordsToday === 0 && s.streakDays === 0;
    }

    reload(): void { this.load(); }

    /** Open the quick-log dialog for today or a selected heatmap date. */
    openEntry(date?: string, projectId?: string, chapterId?: string): void {
        this.entryDialogDate = date;
        const activeProjectId = this.todayProgressMode === 'project' ? this.selectedTodayProjectId : this.summary?.currentProject?.id;
        this.entryDialogProjectId = projectId ?? (date ? undefined : activeProjectId);
        this.entryDialogChapterId = chapterId ?? (date ? undefined : this.defaultEntryChapterId(activeProjectId));
        this.showEntryDialog = true;
    }

    openProjects(): void {
        this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`]);
    }

    onEntrySaved(entry: DailyEntry): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Entry saved',
            detail: entry.date === this.localDate(new Date()) ? 'Today’s writing session has been logged.' : 'Past entry has been updated.'
        });
        this.load();
    }

    onEntryCreateProject(): void {
        this.openProjects();
    }

    onEntryOpenProject(projectId: string): void {
        this.onProjectClick(projectId);
    }

    /** Open dialog editor for a past date from heatmap. */
    onDayClick(date: string): void {
        if (date) this.openEntry(date);
    }

    onProjectClick(id: string): void {
        if (id) this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`, id]);
    }

    get today(): Date { return new Date(); }

    get currentChapterId(): string | undefined {
        return this.summary?.currentChapter?.id;
    }

    get todayProgressSummary(): DashboardSummary | null {
        if (!this.summary) return null;
        if (this.todayProgressMode === 'summary' || !this.selectedTodayProjectId) {
            return this.summaryProgress();
        }

        const entries = this.todayEntriesForProject(this.selectedTodayProjectId);
        const wordsToday = entries.reduce((sum, e) => sum + (e.words || 0), 0);
        const selectedProject = this.projects.find(p => p.id === this.selectedTodayProjectId) ?? this.summary.currentProject;
        const wordsGoal = selectedProject
            ? Math.max(1, resolveProjectWordsGoal(selectedProject, this.chaptersForProject(selectedProject.id), this.summary.wordsGoal))
            : Math.max(1, this.summary.wordsGoal);
        const todayScore = Math.min(100, Math.round((wordsToday / wordsGoal) * 100));

        return {
            ...this.summary,
            todayScore,
            wordsToday,
            wordsGoal,
            currentProject: selectedProject
        };
    }

    onTodayProgressModeChange(mode: 'summary' | 'project'): void {
        this.todayProgressMode = mode;
        if (mode === 'project') this.ensureSelectedTodayProject(this.summary);
        this.loadStoryChapters();
    }

    onTodayProgressProjectChange(projectId: string): void {
        this.selectedTodayProjectId = projectId || undefined;
        this.todayProgressMode = this.selectedTodayProjectId ? 'project' : 'summary';
        this.loadStoryChapters();
    }

    get hasProject(): boolean {
        return !!this.summary?.currentProject;
    }

    get storyProject(): Project | undefined {
        if (this.todayProgressMode === 'project' && this.selectedTodayProjectId) {
            return this.projects.find(p => p.id === this.selectedTodayProjectId) ?? this.summary?.currentProject;
        }
        return this.summary?.currentProject;
    }

    private localDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private ensureSelectedTodayProject(summary: DashboardSummary | null): void {
        if (this.selectedTodayProjectId && this.projects.some(p => p.id === this.selectedTodayProjectId)) return;
        this.selectedTodayProjectId = summary?.currentProject?.id ?? this.projects[0]?.id;
    }

    private summaryProgress(): DashboardSummary {
        return buildInkquestSummaryProgress(this.summary!, this.todayEntries, this.projects, this.projectChapters);
    }

    private todayEntriesForProject(projectId: string): DailyEntry[] {
        return this.todayEntriesByProject[projectId] ?? this.todayEntries.filter(e => e.projectId === projectId);
    }

    private chaptersForProject(projectId: string): Chapter[] {
        if (this.storyProject?.id === projectId && this.chapters.length) return this.chapters;
        return this.projectChapters[projectId] ?? [];
    }

    private toProjectChaptersMap(projects: Project[], chapterGroups: Chapter[][]): Record<string, Chapter[]> {
        return projects.reduce<Record<string, Chapter[]>>((acc, project, index) => {
            acc[project.id] = (chapterGroups[index] ?? []).slice().sort((a, b) => a.no - b.no);
            return acc;
        }, {});
    }

    private toProjectEntriesMap(projects: Project[], entryGroups: DailyEntry[][]): Record<string, DailyEntry[]> {
        return projects.reduce<Record<string, DailyEntry[]>>((acc, project, index) => {
            acc[project.id] = entryGroups[index] ?? [];
            return acc;
        }, {});
    }

    private mergeTodayEntries(dateEntries: DailyEntry[], entriesByProject: Record<string, DailyEntry[]>): DailyEntry[] {
        const byId = new Map<string, DailyEntry>();
        const add = (entry: DailyEntry) => byId.set(entry.id || `${entry.projectId ?? 'none'}-${entry.chapterId ?? 'none'}-${entry.date}`, entry);
        dateEntries.forEach(add);
        Object.values(entriesByProject).flat().forEach(add);
        return Array.from(byId.values());
    }

    private defaultEntryChapterId(projectId: string | undefined): string | undefined {
        if (!projectId) return undefined;
        return projectId === this.summary?.currentProject?.id ? this.currentChapterId : undefined;
    }

    private loadStoryChapters(): void {
        const projectId = this.storyProject?.id;
        this.chapterSub?.unsubscribe();
        if (!projectId) {
            this.chapters = [];
            return;
        }
        this.chapterSub = this.service.searchChapters(projectId)
            .subscribe(cs => {
                const sorted = cs.sort((a, b) => a.no - b.no);
                this.chapters = sorted;
                this.projectChapters = {
                    ...this.projectChapters,
                    [projectId]: sorted
                };
            });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.chapterSub?.unsubscribe();
        clearTimeout(this.loadingTimer);
    }
}
