import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription, forkJoin, of } from 'rxjs';

import { InkquestService } from '../../../../services/inkquest.service';
import { Chapter, DailyEntry, DashboardSummary, Project, buildInkquestSummaryProgress } from '../../../../models/inkquest.models';
import { appProperties } from '../../../../../app.properties';
import { InkquestRingsComponent } from '../inkquest-rings/inkquest-rings.component';

type WidgetState = 'loading' | 'empty' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest-widget',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        SkeletonModule,
        InkquestRingsComponent
    ],
    templateUrl: './inkquest-widget.component.html',
    styleUrls: ['./inkquest-widget.component.scss']
})
export class InkQuestWidgetComponent implements OnInit, OnDestroy {
    @Input() showRedirectButton = true;

    state: WidgetState = 'loading';
    showSkeleton = false;
    summary: DashboardSummary | null = null;

    readonly inkquestRoute = `/${appProperties.rootPath}/inkquest`;

    private sub?: Subscription;
    private loadingTimer?: ReturnType<typeof setTimeout>;

    constructor(private service: InkquestService) {}

    ngOnInit(): void { this.load(); }

    reload(): void { this.load(); }

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
                    next: ([data, todayEntries, chapterGroups, projectEntryGroups]) => {
                        this.stopLoading();
                        const entriesByProject = this.toProjectEntriesMap(projects ?? [], projectEntryGroups as DailyEntry[][]);
                        this.summary = data
                            ? buildInkquestSummaryProgress(
                                data,
                                this.mergeTodayEntries(todayEntries ?? [], entriesByProject),
                                projects ?? [],
                                this.toProjectChaptersMap(projects ?? [], chapterGroups as Chapter[][])
                            )
                            : null;
                        this.state = (!this.summary || this.isEmpty(this.summary)) ? 'empty' : 'loaded';
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

    private localDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        clearTimeout(this.loadingTimer);
    }
}
