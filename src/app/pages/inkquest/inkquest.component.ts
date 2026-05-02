import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../services/inkquest.service';
import { Chapter, DailyEntry, DashboardSummary } from '../../models/inkquest.models';
import { appProperties } from '../../../app.properties';

import { InkquestRingsComponent } from './components/inkquest-rings/inkquest-rings.component';
import { InkquestPlotProgressComponent } from './components/inkquest-plot-progress/inkquest-plot-progress.component';
import { InkquestProgressChartComponent } from './components/inkquest-progress-chart/inkquest-progress-chart.component';
import { InkquestHeatmapComponent } from './components/inkquest-heatmap/inkquest-heatmap.component';
import { InkquestEntryDialogComponent } from './components/inkquest-entry-dialog/inkquest-entry-dialog.component';

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
        InkquestProgressChartComponent,
        InkquestHeatmapComponent,
        InkquestEntryDialogComponent
    ],
    providers: [MessageService],
    templateUrl: './inkquest.component.html',
    styleUrls: ['./inkquest.component.scss']
})
export class InkquestComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    summary: DashboardSummary | null = null;
    chapters: Chapter[] = [];

    showEntryDialog = false;
    entryDialogDate?: string;
    entryDialogProjectId?: string;
    entryDialogChapterId?: string;

    private sub?: Subscription;

    constructor(
        private service: InkquestService,
        private router: Router,
        private messageService: MessageService
    ) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.sub = this.service.getDashboard().subscribe({
            next: summary => {
                this.summary = summary;
                if (!summary) { this.state = 'empty'; return; }
                if (summary.currentProject) {
                    this.service.searchChapters(summary.currentProject.id)
                        .subscribe(cs => (this.chapters = cs));
                }
                this.state = this.isEmpty(summary) ? 'empty' : 'loaded';
            },
            error: () => (this.state = 'error')
        });
    }

    private isEmpty(s: DashboardSummary): boolean {
        return !s.currentProject && s.wordsToday === 0 && s.focusToday === 0 && s.streakDays === 0;
    }

    reload(): void { this.load(); }

    /** Open the quick-log dialog for today or a selected heatmap date. */
    openEntry(date?: string, projectId?: string, chapterId?: string): void {
        this.entryDialogDate = date;
        this.entryDialogProjectId = projectId ?? (date ? undefined : this.summary?.currentProject?.id);
        this.entryDialogChapterId = chapterId ?? (date ? undefined : this.currentChapterId);
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

    get hasProject(): boolean {
        return !!this.summary?.currentProject;
    }

    private localDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }
}
