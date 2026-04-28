import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgCircleProgressModule, CircleProgressOptions } from 'ng-circle-progress';
import { DashboardSummary } from '../../../../models/inkquest.models';

interface Ring {
    label: string;
    centerValue: string;
    subValue: string;
    percent: number;
    color: string;
}

@Component({
    selector: 'app-inkquest-rings',
    standalone: true,
    imports: [
        CommonModule,
        NgCircleProgressModule
    ],
    providers: [
        { provide: CircleProgressOptions, useValue: new CircleProgressOptions() }
    ],
    templateUrl: './inkquest-rings.component.html',
    styleUrls: ['./inkquest-rings.component.scss']
})
export class InkquestRingsComponent implements OnChanges {
    @Input() summary!: DashboardSummary;
    /** When true, renders without the outer card wrapper (for embedding inside another card) */
    @Input() embedded = false;
    /** When true, uses smaller ring sizes (for dashboard widgets) */
    @Input() compact = false;

    heroRing!: Ring;
    secondaryRings: Ring[] = [];

    readonly trackColor = 'rgba(120,120,140,0.18)';

    ngOnChanges(_: SimpleChanges): void { this.build(); }

    private build(): void {
        if (!this.summary) return;

        const pct = (v: number, m: number) =>
            Math.min(100, Math.round(v / (m || 1) * 100));

        const s = this.summary;

        this.heroRing = {
            label: 'Today Score',
            centerValue: `${s.todayScore}%`,
            subValue: '',
            percent: s.todayScore,
            color: '#7c3aed'
        };

        this.secondaryRings = [
            {
                label: 'Output',
                centerValue: `${pct(s.wordsToday, s.wordsGoal)}%`,
                subValue: `${s.wordsToday.toLocaleString()} / ${s.wordsGoal.toLocaleString()} words`,
                percent: pct(s.wordsToday, s.wordsGoal),
                color: '#ef4444'
            },
            {
                label: 'Focus',
                centerValue: `${pct(s.focusToday, s.focusGoal)}%`,
                subValue: `${s.focusToday} / ${s.focusGoal} min`,
                percent: pct(s.focusToday, s.focusGoal),
                color: '#22c55e'
            },
            {
                label: 'Consistency',
                centerValue: `${pct(s.streakDays, s.consistencyGoal)}%`,
                subValue: `${s.streakDays} / ${s.consistencyGoal} days`,
                percent: pct(s.streakDays, s.consistencyGoal),
                color: '#3b82f6'
            }
        ];
    }
}
