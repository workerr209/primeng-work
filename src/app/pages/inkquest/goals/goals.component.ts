import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { DashboardSummary, WritingGoal } from '../../../models/inkquest.models';

type PageState = 'loading' | 'loaded' | 'error';

interface GoalCard {
    key: keyof WritingGoal;
    label: string;
    sublabel: string;   // context label: "Today", "This Month", etc.
    emoji: string;
    current: number;
    target: number;
    unit: string;
    color: string;
}

@Component({
    selector: 'app-inkquest-goals',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, DialogModule, SkeletonModule, ToastModule],
    providers: [MessageService],
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

    constructor(
        private service: InkquestService,
        private messageService: MessageService
    ) {}

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
            { key: 'dailyWords',   label: 'Words / Day',   sublabel: 'Today',      emoji: '📝', current: s?.wordsToday ?? 0, target: g.dailyWords,   unit: 'words', color: '#3b82f6' },
            { key: 'monthlyWords', label: 'Words / Month', sublabel: 'This Month', emoji: '📅', current: thisMonthWords,      target: g.monthlyWords, unit: 'words', color: '#10b981' },
            { key: 'dailyFocus',   label: 'Focus / Day',   sublabel: 'Today',      emoji: '⏱', current: s?.focusToday ?? 0, target: g.dailyFocus,   unit: 'min',   color: '#8b5cf6' },
            { key: 'streakTarget', label: 'Streak Target', sublabel: 'Current',    emoji: '🔥', current: s?.streakDays ?? 0, target: g.streakTarget, unit: 'days',  color: '#f59e0b' }
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
        if (!this.isValidDraft()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid goals',
                detail: 'Goals must be greater than zero.'
            });
            return;
        }
        this.saving = true;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveGoals(this.draft).subscribe({
            next: saved => {
                this.goals = saved;
                if (this.summary) this.buildCards(saved, this.summary);
                this.saving = false;
                this.showDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Goals saved',
                    detail: 'Writing goals have been updated.'
                });
            },
            error: () => {
                this.saving = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save failed',
                    detail: 'Could not save goals.'
                });
            }
        });
    }

    private isValidDraft(): boolean {
        return this.draft.dailyWords > 0 &&
            this.draft.monthlyWords > 0 &&
            this.draft.dailyFocus > 0 &&
            this.draft.streakTarget > 0;
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.saveSub?.unsubscribe();
    }
}
