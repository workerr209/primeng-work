import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { Subscription, debounceTime } from 'rxjs';

import { LayoutService } from '../../layout/service/layout.service';
import { InkquestService } from '../../services/inkquest.service';
import { DashboardSummary } from '../../models/inkquest.models';
import { appProperties } from '../../../app.properties';

type WidgetState = 'loading' | 'empty' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest-widget',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ChartModule,
        ButtonModule,
        SkeletonModule,
        RippleModule
    ],
    templateUrl: './inkquest-widget.component.html',
    styleUrls: ['./inkquest-widget.component.scss']
})
export class InkQuestWidgetComponent implements OnInit, OnDestroy {
    /** Hide the redirect button if the widget is already shown inside the main page. */
    @Input() showRedirectButton = true;

    state: WidgetState = 'loading';
    summary: DashboardSummary | null = null;

    todayScoreData: any;
    wordsData: any;
    focusData: any;
    consistencyData: any;
    ringOptions: any;

    readonly inkquestRoute = `/${appProperties.rootPath}/inkquest`;
    readonly skeletonSlots = [0, 1, 2, 3];

    private sub?: Subscription;
    private layoutSub?: Subscription;

    constructor(
        private service: InkquestService,
        private layout: LayoutService
    ) {
        this.layoutSub = this.layout.configUpdate$
            .pipe(debounceTime(50))
            .subscribe(() => {
                if (this.state === 'loaded') this.buildCharts();
            });
    }

    ngOnInit(): void {
        this.load();
    }

    reload(): void {
        this.load();
    }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.sub = this.service.getDashboard().subscribe({
            next: data => {
                this.summary = data;
                if (!data || this.isEmpty(data)) {
                    this.state = 'empty';
                } else {
                    this.state = 'loaded';
                    this.buildCharts();
                }
            },
            error: () => {
                this.state = 'error';
            }
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

    private buildCharts(): void {
        if (!this.summary) return;

        const trackColor = 'rgba(120,120,140,0.18)';
        const make = (value: number, max: number, color: string) => ({
            datasets: [
                {
                    data: [Math.min(value, max), Math.max(0, max - value)],
                    backgroundColor: [color, trackColor],
                    borderWidth: 0,
                    cutout: '78%',
                    borderRadius: 8,
                    spacing: 0
                }
            ]
        });

        this.todayScoreData = make(this.summary.todayScore, 100, '#ec4899');
        this.wordsData = make(
            this.summary.wordsToday,
            this.summary.wordsGoal,
            '#ef4444'
        );
        this.focusData = make(
            this.summary.focusToday,
            this.summary.focusGoal,
            '#22c55e'
        );
        this.consistencyData = make(
            this.summary.streakDays,
            this.summary.consistencyGoal,
            '#3b82f6'
        );

        this.ringOptions = {
            cutout: '78%',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600 },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        };
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.layoutSub?.unsubscribe();
    }
}
