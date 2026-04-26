import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../services/inkquest.service';
import {
    Chapter,
    DailyEntry,
    DashboardSummary
} from '../../models/inkquest.models';

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
        RippleModule,
        InkquestRingsComponent,
        InkquestPlotProgressComponent,
        InkquestProgressChartComponent,
        InkquestHeatmapComponent,
        InkquestEntryDialogComponent
    ],
    templateUrl: './inkquest.component.html',
    styleUrls: ['./inkquest.component.scss']
})
export class InkquestComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    summary: DashboardSummary | null = null;
    chapters: Chapter[] = [];

    showEntryDialog = false;
    savingEntry = false;

    private sub?: Subscription;
    private saveSub?: Subscription;

    constructor(private service: InkquestService) {}

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.sub = this.service.getDashboard().subscribe({
            next: summary => {
                this.summary = summary;
                if (!summary) {
                    this.state = 'empty';
                    return;
                }
                if (summary.currentProject) {
                    this.service
                        .searchChapters(summary.currentProject.id)
                        .subscribe(cs => (this.chapters = cs));
                }
                this.state = this.isEmpty(summary) ? 'empty' : 'loaded';
            },
            error: () => (this.state = 'error')
        });
    }

    private isEmpty(s: DashboardSummary): boolean {
        return (
            !s.currentProject &&
            s.wordsToday === 0 &&
            s.focusToday === 0 &&
            s.streakDays === 0
        );
    }

    reload(): void { this.load(); }

    openEntry(): void {
        this.showEntryDialog = true;
    }

    onSaveEntry(payload: Partial<DailyEntry>): void {
        this.savingEntry = true;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveEntry(payload).subscribe({
            next: () => {
                this.savingEntry = false;
                this.showEntryDialog = false;
                this.load();
            },
            error: () => {
                this.savingEntry = false;
            }
        });
    }

    get currentChapterId(): string | undefined {
        return this.summary?.currentChapter?.id;
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.saveSub?.unsubscribe();
    }
}
