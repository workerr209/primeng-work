import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { DashboardSummary, WritingGoal } from '../../../models/inkquest.models';

type PageState = 'loading' | 'loaded' | 'error';

interface GoalCard {
    key: keyof WritingGoal;
    label: string;
    emoji: string;
    current: number;
    target: number;
    unit: string;
    color: string;
}

@Component({
    selector: 'app-inkquest-goals',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, DialogModule, SkeletonModule],
    templateUrl: './goals.component.html',
    styleUrls: ['./goals.component.scss']
})
export class InkquestGoalsComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    goals: WritingGoal | null = null;
    summary: DashboardSummary | null = null;
    cards: GoalCard[] = [];

    showDialog = false;
    saving = false;
    draft: WritingGoal = { dailyWords: 1000, monthlyWords: 20000, dailyFocus: 60, streakTarget: 7 };

    private sub?: Subscription;
    private saveSub?: Subscription;

    constructor(private service: InkquestService) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.service.getGoals().subscribe({
            next: goals => {
                this.goals = goals;
                this.service.getDashboard().subscribe({
                    next: summary => {
                        this.summary = summary;
                        this.buildCards(goals, summary);
                        this.state = 'loaded';
                    },
                    error: () => (this.state = 'error')
                });
            },
            error: () => (this.state = 'error')
        });
    }

    reload(): void { this.load(); }

    private buildCards(g: WritingGoal, s: DashboardSummary | null): void {
        // cumulative is a running total; current month = last - second-last
        const cum = s?.cumulative ?? [];
        const thisMonthWords = cum.length >= 2
            ? cum[cum.length - 1].words - cum[cum.length - 2].words
            : cum.length === 1 ? cum[0].words : 0;
        this.cards = [
            { key: 'dailyWords',   label: 'คำ/วัน',     emoji: '📝', current: s?.wordsToday ?? 0,  target: g.dailyWords,   unit: 'คำ',   color: '#3b82f6' },
            { key: 'monthlyWords', label: 'คำ/เดือนนี้', emoji: '📅', current: thisMonthWords,        target: g.monthlyWords, unit: 'คำ',   color: '#10b981' },
            { key: 'dailyFocus',   label: 'โฟกัส/วัน',  emoji: '⏱', current: s?.focusToday ?? 0,  target: g.dailyFocus,   unit: 'นาที', color: '#8b5cf6' },
            { key: 'streakTarget', label: 'Streak',      emoji: '🔥', current: s?.streakDays ?? 0,  target: g.streakTarget, unit: 'วัน',  color: '#f59e0b' }
        ];
    }

    progress(c: GoalCard): number {
        if (!c.target) return 0;
        return Math.min(100, Math.round((c.current / c.target) * 100));
    }

    openEdit(): void {
        if (this.goals) this.draft = { ...this.goals };
        this.showDialog = true;
    }

    save(): void {
        this.saving = true;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveGoals(this.draft).subscribe({
            next: saved => {
                this.goals = saved;
                if (this.summary) this.buildCards(saved, this.summary);
                this.saving = false;
                this.showDialog = false;
            },
            error: () => (this.saving = false)
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.saveSub?.unsubscribe();
    }
}
