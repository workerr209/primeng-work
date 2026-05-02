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
    todayScoreLabel = '';
    nextStepText = '';

    readonly trackColor = 'rgba(120,120,140,0.18)';

    ngOnChanges(_: SimpleChanges): void { this.build(); }

    private build(): void {
        if (!this.summary) return;

        const pct = (v: number, m: number) =>
            Math.min(100, Math.round(v / (m || 1) * 100));

        const s = this.summary;
        const wordsPercent = pct(s.wordsToday, s.wordsGoal);
        const focusPercent = pct(s.focusToday, s.focusGoal);
        const streakPercent = pct(s.streakDays, s.consistencyGoal);
        const remainingWords = Math.max(0, s.wordsGoal - s.wordsToday);
        const remainingFocus = Math.max(0, s.focusGoal - s.focusToday);

        this.heroRing = {
            label: 'Words Today',
            centerValue: `${wordsPercent}%`,
            subValue: `${s.wordsToday.toLocaleString()} / ${s.wordsGoal.toLocaleString()} words`,
            percent: wordsPercent,
            color: 'var(--p-primary-500, var(--primary-color))'
        };
        this.todayScoreLabel = `${s.todayScore}% day score`;
        this.nextStepText = remainingWords > 0
            ? `${remainingWords.toLocaleString()} words left to hit today's goal`
            : remainingFocus > 0
                ? `${remainingFocus} focus minutes left to complete today`
                : 'Daily goals completed';

        this.secondaryRings = [
            {
                label: 'Focus',
                centerValue: `${focusPercent}%`,
                subValue: `${s.focusToday} / ${s.focusGoal} min`,
                percent: focusPercent,
                color: 'var(--p-green-500, #22c55e)'
            },
            {
                label: 'Streak',
                centerValue: `${streakPercent}%`,
                subValue: `${s.streakDays} / ${s.consistencyGoal} days`,
                percent: streakPercent,
                color: 'var(--text-color)'
            }
        ];
    }
}
