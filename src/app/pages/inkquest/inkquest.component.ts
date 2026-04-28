import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../services/inkquest.service';
import { Chapter, DashboardSummary } from '../../models/inkquest.models';
import { appProperties } from '../../../app.properties';

import { InkquestRingsComponent } from './components/inkquest-rings/inkquest-rings.component';
import { InkquestPlotProgressComponent } from './components/inkquest-plot-progress/inkquest-plot-progress.component';
import { InkquestProgressChartComponent } from './components/inkquest-progress-chart/inkquest-progress-chart.component';
import { InkquestHeatmapComponent } from './components/inkquest-heatmap/inkquest-heatmap.component';

type PageState = 'loading' | 'empty' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        SkeletonModule,
        InkquestRingsComponent,
        InkquestPlotProgressComponent,
        InkquestProgressChartComponent,
        InkquestHeatmapComponent
    ],
    templateUrl: './inkquest.component.html',
    styleUrls: ['./inkquest.component.scss']
})
export class InkquestComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    summary: DashboardSummary | null = null;
    chapters: Chapter[] = [];

    private sub?: Subscription;

    constructor(
        private service: InkquestService,
        private router: Router
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

    goToEntry(): void {
        this.router.navigate([`/${appProperties.rootPath}/inkquest/daily-entry`]);
    }

    ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
