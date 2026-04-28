import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { DailyEntry, WritingFlow } from '../../../models/inkquest.models';
import { appProperties } from '../../../../app.properties';

type PageState = 'loading' | 'loaded' | 'error';
interface FlowOption { label: string; emoji: string; value: WritingFlow; }

@Component({
    selector: 'app-inkquest-daily-entry',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, InputNumberModule, SelectModule,
        TextareaModule, SkeletonModule
    ],
    templateUrl: './daily-entry.component.html',
    styleUrls: ['./daily-entry.component.scss']
})
export class InkquestDailyEntryComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    targetDate = new Date().toISOString().slice(0, 10);
    isEditing = false;
    entry: Partial<DailyEntry> = {};
    chapterOptions: { label: string; value: string }[] = [];
    saving = false;

    readonly flowOptions: FlowOption[] = [
        { label: 'Fire', emoji: '🔥', value: 'fire' },
        { label: 'Ok',   emoji: '😐', value: 'ok'   },
        { label: 'Slow', emoji: '🐢', value: 'slow'  }
    ];

    private sub?: Subscription;
    private saveSub?: Subscription;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private service: InkquestService
    ) {}

    ngOnInit(): void {
        const d = this.route.snapshot.paramMap.get('date');
        if (d) { this.targetDate = d; this.isEditing = true; }
        this.load();
    }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.sub = this.service.getDashboard().subscribe({
            next: summary => {
                if (summary?.currentProject) {
                    this.service.searchChapters(summary.currentProject.id).subscribe(cs => {
                        this.chapterOptions = cs.map(c => ({
                            label: `ตอนที่ ${c.no} — ${c.title}`,
                            value: c.id
                        }));
                    });
                }
                if (this.isEditing) {
                    this.service.searchEntries().subscribe({
                        next: entries => {
                            const ex = entries.find(e => e.date === this.targetDate);
                            this.entry = ex ? { ...ex } : this.blank();
                            this.state = 'loaded';
                        },
                        error: () => (this.state = 'error')
                    });
                } else {
                    this.entry = this.blank();
                    this.state = 'loaded';
                }
            },
            error: () => (this.state = 'error')
        });
    }

    private blank(): Partial<DailyEntry> {
        return { date: this.targetDate, words: 0, focusMinutes: 0, sessions: 1 };
    }

    reload(): void { this.load(); }

    setFlow(v: WritingFlow): void {
        this.entry.flow = this.entry.flow === v ? undefined : v;
    }

    submit(): void {
        this.saving = true;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveEntry({ ...this.entry, date: this.targetDate }).subscribe({
            next: () => {
                this.saving = false;
                this.router.navigate([`/${appProperties.rootPath}/inkquest`]);
            },
            error: () => (this.saving = false)
        });
    }

    back(): void { this.router.navigate([`/${appProperties.rootPath}/inkquest`]); }

    get isToday(): boolean { return this.targetDate === new Date().toISOString().slice(0, 10); }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.saveSub?.unsubscribe();
    }
}
