import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { Subscription, debounceTime } from 'rxjs';
import { LayoutService } from '../../../../layout/service/layout.service';
import { DashboardSummary } from '../../../../models/inkquest.models';

interface Ring {
    key: 'today' | 'words' | 'focus' | 'consistency';
    label: string;
    centerValue: string;
    centerSub: string;
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

    rings: Ring[] = [];
    options: any;

    private layoutSub?: Subscription;

    constructor(private layout: LayoutService) {
        this.layoutSub = this.layout.configUpdate$
            .pipe(debounceTime(50))
            .subscribe(() => this.build());
    }

    ngOnInit(): void {
        this.build();
    }

    ngOnChanges(_: SimpleChanges): void {
        this.build();
    }

    private build(): void {
        if (!this.summary) return;
        const trackColor = 'rgba(120,120,140,0.18)';
        const make = (value: number, max: number, color: string) => ({
            datasets: [
                {
                    data: [Math.min(value, max), Math.max(0, max - value)],
                    backgroundColor: [color, trackColor],
                    borderWidth: 0,
                    cutout: '78%',
                    borderRadius: 10,
                    spacing: 0
                }
            ]
        });

        const s = this.summary;
        this.rings = [
            {
                key: 'today',
                label: 'Today Score',
                centerValue: `${s.todayScore}%`,
                centerSub: 'Today Score',
                color: '#ec4899',
                data: make(s.todayScore, 100, '#ec4899')
            },
            {
                key: 'words',
                label: 'Words',
                centerValue: `${s.wordsToday.toLocaleString()}`,
                centerSub: `${s.wordsGoal.toLocaleString()} words`,
                color: '#ef4444',
                data: make(s.wordsToday, s.wordsGoal, '#ef4444')
            },
            {
                key: 'focus',
                label: 'Focus Time',
                centerValue: `${s.focusToday}/${s.focusGoal}`,
                centerSub: 'min',
                color: '#22c55e',
                data: make(s.focusToday, s.focusGoal, '#22c55e')
            },
            {
                key: 'consistency',
                label: 'Consistency',
                centerValue: `${s.streakDays}`,
                centerSub: 'days streak',
                color: '#3b82f6',
                data: make(s.streakDays, s.consistencyGoal, '#3b82f6')
            }
        ];

        this.options = {
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
        this.layoutSub?.unsubscribe();
    }
}
