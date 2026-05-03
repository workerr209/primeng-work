import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, Subscription } from 'rxjs';

import { InkquestService } from '../../services/inkquest.service';
import { Chapter, DailyEntry, DashboardSummary, Project } from '../../models/inkquest.models';
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
        this.sub = forkJoin([
            this.service.getDashboard(),
            this.service.searchProjects(),
            this.service.searchEntries({ date: today })
        ]).subscribe({
            next: ([summary, projects, todayEntries]) => {
                this.stopLoading();
                this.summary = summary;
                this.projects = projects ?? [];
                this.todayEntries = todayEntries ?? [];
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
        return !s.currentProject && s.wordsToday === 0 && s.focusToday === 0 && s.streakDays === 0;
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

        const entries = this.todayEntries.filter(e => e.projectId === this.selectedTodayProjectId);
        const wordsToday = entries.reduce((sum, e) => sum + (e.words || 0), 0);
        const focusToday = entries.reduce((sum, e) => sum + (e.focusMinutes || 0), 0);
        const wordsGoal = Math.max(1, this.summary.wordsGoal);
        const focusGoal = Math.max(1, this.summary.focusGoal);
        const todayScore = Math.min(100, Math.round(((wordsToday / wordsGoal) * 0.6 + (focusToday / focusGoal) * 0.4) * 100));
        const selectedProject = this.projects.find(p => p.id === this.selectedTodayProjectId) ?? this.summary.currentProject;

        return {
            ...this.summary,
            todayScore,
            wordsToday,
            focusToday,
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
        const projectCount = Math.max(1, new Set(
            this.todayEntries
                .map(e => e.projectId)
                .filter((id): id is string => !!id)
        ).size);
        const wordsGoal = Math.max(1, this.summary!.wordsGoal * projectCount);
        const focusGoal = Math.max(1, this.summary!.focusGoal * projectCount);
        const todayScore = Math.min(100, Math.round(((this.summary!.wordsToday / wordsGoal) * 0.6 + (this.summary!.focusToday / focusGoal) * 0.4) * 100));
        return {
            ...this.summary!,
            wordsGoal,
            focusGoal,
            todayScore
        };
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
            .subscribe(cs => (this.chapters = cs.sort((a, b) => a.no - b.no)));
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.chapterSub?.unsubscribe();
        clearTimeout(this.loadingTimer);
    }
}
