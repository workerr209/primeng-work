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
    @Input() cumulative: { month: string; words: number }[] = [];

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
        const ds = getComputedStyle(document.documentElement);
        const textColor = ds.getPropertyValue('--text-color').trim() || '#fff';
        const muted = ds.getPropertyValue('--text-color-secondary').trim();
        const border = ds.getPropertyValue('--surface-border').trim();

        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jun', 'Jul', 'Aug', 'Sep'];
        const dailyValues = [100, 600, 350, 500, 600, 600, 600, 700, 900, 1000];
        const cumulativeValues = this.cumulative.length
            ? this.cumulative.map(c => c.words)
            : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        this.chartData = {
            labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Word Count',
                    data: dailyValues,
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236,72,153,0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ec4899',
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Cumulative',
                    data: cumulativeValues,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.15)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        };

        this.chartOptions = {
            maintainAspectRatio: false,
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: { color: textColor, usePointStyle: true, padding: 14 }
                },
                tooltip: { enabled: true }
            },
            scales: {
                x: {
                    ticks: { color: muted },
                    grid: { color: 'transparent' }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    ticks: { color: muted },
                    grid: { color: border, drawTicks: false }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    ticks: {
                        color: muted,
                        callback: (v: any) =>
                            typeof v === 'number' && v >= 1000 ? (v / 1000) + 'k' : v
                    },
                    grid: { display: false }
                }
            }
        };
    }

    ngOnDestroy(): void {
        this.layoutSub?.unsubscribe();
    }
}
