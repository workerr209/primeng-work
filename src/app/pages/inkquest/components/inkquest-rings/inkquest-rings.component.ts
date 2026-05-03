import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DashboardSummary, Project } from '../../../../models/inkquest.models';

interface Ring {
    label: string;
    centerValue: string;
    subValue: string;
    percent: number;
    color: string;
    toneClass?: string;
}

@Component({
    selector: 'app-inkquest-rings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SelectModule
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
    @Input() showViewControls = false;
    @Input() viewMode: 'summary' | 'project' = 'summary';
    @Input() projects: Project[] = [];
    @Input() selectedProjectId?: string;

    @Output() viewModeChange = new EventEmitter<'summary' | 'project'>();
    @Output() selectedProjectIdChange = new EventEmitter<string>();

    heroRing!: Ring;
    secondaryRings: Ring[] = [];
    todayScoreLabel = '';
    nextStepText = '';

    ngOnChanges(_: SimpleChanges): void { this.build(); }

    setViewMode(mode: 'summary' | 'project'): void {
        this.viewModeChange.emit(mode);
    }

    onProjectChange(value: unknown): void {
        this.selectedProjectIdChange.emit(String(value || ''));
    }

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

        const isSummaryView = this.showViewControls && this.viewMode === 'summary';

        this.heroRing = {
            label: 'Words Today',
            centerValue: `${wordsPercent}%`,
            subValue: `${s.wordsToday.toLocaleString()} / ${s.wordsGoal.toLocaleString()} words`,
            percent: wordsPercent,
            color: 'var(--p-primary-500, var(--primary-color))'
        };
        this.todayScoreLabel = `${s.todayScore}% day score`;
        this.nextStepText = isSummaryView
            ? 'Combined writing across all projects today'
            : remainingWords > 0
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
                color: '',
                toneClass: 'metric-focus'
            },
            {
                label: 'Streak',
                centerValue: `${streakPercent}%`,
                subValue: `${s.streakDays} / ${s.consistencyGoal} days`,
                percent: streakPercent,
                color: '',
                toneClass: 'metric-streak'
            }
        ];
    }
}
