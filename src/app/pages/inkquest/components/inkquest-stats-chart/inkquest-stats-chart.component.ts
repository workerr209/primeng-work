import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { Subscription, debounceTime } from 'rxjs';
import { LayoutService } from '../../../../layout/service/layout.service';

export interface StatsChartData {
    labels: string[];
    values: number[];
    color: string;
    type: 'bar' | 'line';
}

@Component({
    selector: 'app-inkquest-stats-chart',
    standalone: true,
    imports: [CommonModule, ChartModule],
    template: `
        <div style="position: relative;">
            <p-chart
                *ngIf="chartData"
                [type]="data.type"
                [data]="chartData"
                [options]="chartOptions"
                height=224>
            </p-chart>
        </div>
    `,
    styles: [`:host { display: block; }`]
})
export class InkquestStatsChartComponent implements OnInit, OnChanges, OnDestroy {
    @Input() data!: StatsChartData;

    chartData: any = null;
    chartOptions: any = null;

    private layoutSub?: Subscription;

    constructor(private layout: LayoutService) {
        this.layoutSub = this.layout.configUpdate$
            .pipe(debounceTime(50))
            .subscribe(() => this.build());
    }

    ngOnInit(): void { this.build(); }
    ngOnChanges(_: SimpleChanges): void { this.build(); }

    private build(): void {
        if (!this.data?.labels?.length) return;

        const ds = getComputedStyle(document.documentElement);
        const textColor = ds.getPropertyValue('--text-color').trim() || '#fff';
        const muted     = ds.getPropertyValue('--text-color-secondary').trim();
        const border    = ds.getPropertyValue('--surface-border').trim();

        const isBar = this.data.type === 'bar';

        this.chartData = {
            labels: this.data.labels,
            datasets: [{
                type: this.data.type,
                label: 'คำ',
                data: this.data.values,
                borderColor: this.data.color,
                backgroundColor: isBar ? this.data.color + 'cc' : this.data.color + '33',
                fill: !isBar,
                tension: 0.4,
                borderRadius: isBar ? 4 : 0,
                pointRadius: isBar ? 0 : 3,
                borderWidth: 2
            }]
        };

        this.chartOptions = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                x: { ticks: { color: muted }, grid: { color: 'transparent' } },
                y: { ticks: { color: muted, callback: (v: any) => typeof v === 'number' && v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v },
                     grid: { color: border, drawTicks: false } }
            }
        };
    }

    ngOnDestroy(): void { this.layoutSub?.unsubscribe(); }
}
