import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { Subscription, debounceTime } from 'rxjs';
import { LayoutService } from '../../../../layout/service/layout.service';
import { DashboardSummary } from '../../../../models/inkquest.models';

interface Ring {
    label: string;
    centerValue: string;
    subValue: string;
    color: string;
    data: any;
}

@Component({
    selector: 'app-inkquest-rings',
    standalone: true,
    imports: [CommonModule, ChartModule],
    templateUrl: './inkquest-rings.component.html',
    styleUrls: ['./inkquest-rings.component.scss']
})
export class InkquestRingsComponent implements OnInit, OnDestroy, OnChanges {
    @Input() summary!: DashboardSummary;

    heroRing!: Ring;
    secondaryRings: Ring[] = [];
    options: any;

    private layoutSub?: Subscription;

    constructor(private layout: LayoutService) {
        this.layoutSub = this.layout.configUpdate$
            .pipe(debounceTime(50))
            .subscribe(() => this.build());
    }

    ngOnInit(): void { this.build(); }
    ngOnChanges(_: SimpleChanges): void { this.build(); }

    private build(): void {
        if (!this.summary) return;

        const trackColor = 'rgba(120,120,140,0.18)';
        const make = (value: number, max: number, color: string) => ({
            datasets: [{
                data: [Math.min(value, max), Math.max(0, max - value)],
                backgroundColor: [color, trackColor],
                borderWidth: 0,
                cutout: '78%',
                borderRadius: [10, 0],
                spacing: 0
            }]
        });

        const pct = (v: number, m: number) =>
            `${Math.min(100, Math.round(v / (m || 1) * 100))}%`;

        const s = this.summary;

        this.heroRing = {
            label: 'Today Score',
            centerValue: `${s.todayScore}%`,
            subValue: '',
            color: '#7c3aed',
            data: make(s.todayScore, 100, '#7c3aed')
        };

        this.secondaryRings = [
            {
                label: 'Output',
                centerValue: pct(s.wordsToday, s.wordsGoal),
                subValue: `${s.wordsToday.toLocaleString()} / ${s.wordsGoal.toLocaleString()} words`,
                color: '#ef4444',
                data: make(s.wordsToday, s.wordsGoal, '#ef4444')
            },
            {
                label: 'Focus',
                centerValue: pct(s.focusToday, s.focusGoal),
                subValue: `${s.focusToday} / ${s.focusGoal} min`,
                color: '#22c55e',
                data: make(s.focusToday, s.focusGoal, '#22c55e')
            },
            {
                label: 'Consistency',
                centerValue: pct(s.streakDays, s.consistencyGoal),
                subValue: `${s.streakDays} / ${s.consistencyGoal} days`,
                color: '#3b82f6',
                data: make(s.streakDays, s.consistencyGoal, '#3b82f6')
            }
        ];

        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600 },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        };
    }

    ngOnDestroy(): void { this.layoutSub?.unsubscribe(); }
}
