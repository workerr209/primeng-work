import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LayoutService } from "../../layout/service/layout.service";
import { debounceTime, Subscription } from "rxjs";
import { ChartModule } from "primeng/chart";
import { FluidModule } from "primeng/fluid";

type ViewMode = 'day' | 'month' | 'year';

interface PeriodData {
    labels: string[];
    scores: number[];
    maxPerPeriod: number;
}

@Component({
    selector: "app-inkquest-widget",
    templateUrl: "./inkquest-widget.component.html",
    standalone: true,
    imports: [CommonModule, ChartModule, FluidModule],
})
export class InkQuestWidgetComponent implements OnInit, OnDestroy {
    activeView: ViewMode = 'month';
    chartData: any;
    chartOptions: any;
    subscription!: Subscription;

    totalScore = 0;
    maxPossible = 0;
    progressPercent = 0;
    isEmpty = false;
    periodLabel = '';
    private primaryColorHex = '#6366f1';

    readonly viewModes: Array<{ label: string; value: ViewMode }> = [
        { label: 'Day',   value: 'day'   },
        { label: 'Month', value: 'month' },
        { label: 'Year',  value: 'year'  },
    ];

    // Replace with real service data as needed
    private readonly mockData: Record<ViewMode, PeriodData> = {
        day: {
            labels: [],
            scores: [],
            maxPerPeriod: 1000,
        },
        month: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            scores: [4200, 6800, 3100, 5500],
            maxPerPeriod: 7000,
        },
        year: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            scores: [25000, 42000, 18000, 35000],
            maxPerPeriod: 50000,
        },
    };

    constructor(private layoutService: LayoutService) {
        this.subscription = this.layoutService.configUpdate$
            .pipe(debounceTime(25))
            .subscribe(() => this.initCharts());
    }

    ngOnInit(): void {
        this.initCharts();
    }

    setView(mode: ViewMode): void {
        this.activeView = mode;
        this.initCharts();
    }

    initCharts(): void {
        const style = getComputedStyle(document.documentElement);
        const textColor   = style.getPropertyValue('--text-color');
        const borderColor = style.getPropertyValue('--surface-border');
        const textMuted   = style.getPropertyValue('--text-color-secondary');
        const primaryColor = style.getPropertyValue('--p-primary-400').trim();
        this.primaryColorHex = primaryColor || '#6366f1';

        const { labels, scores, maxPerPeriod } = this.mockData[this.activeView];

        this.isEmpty = labels.length === 0 || scores.every(s => s === 0);
        this.totalScore = scores.reduce((a, b) => a + b, 0);
        this.maxPossible = maxPerPeriod * (labels.length || 1);
        this.progressPercent = this.maxPossible > 0
            ? Math.min(100, Math.round((this.totalScore / this.maxPossible) * 100))
            : 0;
        this.periodLabel = this.buildPeriodLabel();

        if (this.isEmpty) return;

        this.chartData = {
            labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Score',
                    backgroundColor: primaryColor,
                    data: scores,
                    barThickness: 32,
                    borderRadius: 6,
                    order: 2,
                },
                {
                    type: 'line',
                    label: 'Max / Period',
                    data: Array(labels.length).fill(maxPerPeriod),
                    borderDash: [6, 4],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0,
                    order: 1,
                },
            ],
        };

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) =>
                            ` ${ctx.dataset.label}: ${(ctx.raw as number)?.toLocaleString() ?? ctx.raw}`,
                    },
                },
            },
            scales: {
                x: {
                    ticks: { color: textMuted },
                    grid: { color: 'transparent', borderColor: 'transparent' },
                },
                y: {
                    ticks: { color: textMuted },
                    grid: { color: borderColor, borderColor: 'transparent', drawTicks: false },
                },
            },
        };
    }

    getProgressColor(): string {
        if (this.progressPercent >= 80) return '#22c55e';
        if (this.progressPercent >= 50) return this.primaryColorHex;
        return '#f59e0b';
    }

    private buildPeriodLabel(): string {
        const now = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        switch (this.activeView) {
            case 'day':   return `Today, ${months[now.getMonth()]} ${now.getDate()}`;
            case 'month': return `${months[now.getMonth()]} ${now.getFullYear()}`;
            case 'year':  return `${now.getFullYear()}`;
        }
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}