import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { Subscription, debounceTime } from 'rxjs';
import { LayoutService } from '../../../../layout/service/layout.service';

@Component({
    selector: 'app-inkquest-progress-chart',
    standalone: true,
    imports: [CommonModule, ChartModule],
    templateUrl: './inkquest-progress-chart.component.html',
    styleUrls: ['./inkquest-progress-chart.component.scss']
})
export class InkquestProgressChartComponent implements OnInit, OnDestroy, OnChanges {
    @Input() weekly: { date: string; score: number; words: number }[] = [];
    @Input() wordsGoal = 0;

    chartData: any;
    chartOptions: any;

    private layoutSub?: Subscription;

    constructor(private layout: LayoutService) {
        this.layoutSub = this.layout.configUpdate$
            .pipe(debounceTime(50))
            .subscribe(() => this.build());
    }

    ngOnInit(): void { this.build(); }
    ngOnChanges(_: SimpleChanges): void { this.build(); }

    private build(): void {
        if (!this.weekly?.length) return;

        const ds     = getComputedStyle(document.documentElement);
        const muted  = ds.getPropertyValue('--text-color-secondary').trim();
        const border = ds.getPropertyValue('--surface-border').trim();

        const labels = this.weekly.map(d => d.date);
        const words  = this.weekly.map(d => d.words);

        // Green bar if goal met, blue otherwise
        const barColors = words.map(w =>
            this.wordsGoal > 0 && w >= this.wordsGoal
                ? 'rgba(16, 185, 129, 0.85)'
                : 'rgba(59, 130, 246, 0.80)'
        );

        const suggestedMax = Math.max(...words, this.wordsGoal, 1) * 1.18;

        this.chartData = {
            labels,
            datasets: [{
                type: 'bar',
                label: 'Words',
                data: words,
                backgroundColor: barColors,
                borderRadius: 5,
                borderSkipped: false
            }]
        };

        this.chartOptions = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (ctx: any) => ` ${(ctx.parsed.y as number).toLocaleString()} words`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: muted },
                    grid: { color: 'transparent' }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax,
                    ticks: {
                        color: muted,
                        callback: (v: any) =>
                            typeof v === 'number' && v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v
                    },
                    grid: { color: border, drawTicks: false }
                }
            }
        };
    }

    ngOnDestroy(): void { this.layoutSub?.unsubscribe(); }
}
