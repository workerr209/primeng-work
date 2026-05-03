import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../../services/inkquest.service';
import { Chapter, DailyEntry, Project, WritingFlow, WritingGoal } from '../../../../models/inkquest.models';

interface FlowOption { label: string; emoji: string; value: WritingFlow; }
type DialogState = 'idle' | 'loading' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest-entry-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        InputNumberModule,
        SelectModule,
        TextareaModule,
        SkeletonModule
    ],
    templateUrl: './inkquest-entry-dialog.component.html',
    styleUrls: ['./inkquest-entry-dialog.component.scss']
})
export class InkquestEntryDialogComponent implements OnChanges, OnDestroy {
    @Input() visible = false;
    @Input() targetDate?: string;
    @Input() defaultProjectId?: string;
    @Input() defaultChapterId?: string;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() saved = new EventEmitter<DailyEntry>();
    @Output() createProject = new EventEmitter<void>();
    @Output() openProject = new EventEmitter<string>();

    state: DialogState = 'idle';
    showSkeleton = false;
    entry: Partial<DailyEntry> = {};
    projects: Project[] = [];
    projectOptions: { label: string; value: string }[] = [];
    chapterOptions: { label: string; value: string }[] = [];
    dayEntries: DailyEntry[] = [];
    chapterCount = 0;
    goals: WritingGoal | null = null;
    saving = false;
    effectiveDate = this.localDate(new Date());
    isEditing = false;

    readonly flowOptions: FlowOption[] = [
        { label: 'Fire', emoji: '🔥', value: 'fire' },
        { label: 'Ok',   emoji: '😐', value: 'ok'   },
        { label: 'Slow', emoji: '🐢', value: 'slow'  }
    ];

    private loadSub?: Subscription;
    private goalsSub?: Subscription;
    private chaptersSub?: Subscription;
    private saveSub?: Subscription;
    private entrySub?: Subscription;
    private loadingTimer?: ReturnType<typeof setTimeout>;

    constructor(
        private service: InkquestService,
        private messageService: MessageService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.load();
        }
        if (!changes['visible'] && this.visible && (changes['targetDate'] || changes['defaultProjectId'] || changes['defaultChapterId'])) {
            this.load();
        }
    }

    private load(): void {
        this.effectiveDate = this.targetDate ?? this.localDate(new Date());
        this.startLoading();
        this.loadSub?.unsubscribe();
        this.goalsSub?.unsubscribe();
        this.entrySub?.unsubscribe();
        this.chaptersSub?.unsubscribe();
        this.dayEntries = [];
        this.goalsSub = this.service.getGoals().subscribe({ next: g => (this.goals = g) });

        this.loadSub = this.service.searchProjects().subscribe({
            next: projects => {
                this.projects = projects;
                this.projectOptions = projects.map(p => ({ label: p.title, value: p.id }));
                if (!this.targetDate) {
                    this.entrySub = this.service.searchEntries({ date: this.effectiveDate }).subscribe({
                        next: entries => {
                            this.dayEntries = entries ?? [];
                            const defaultProjectId = this.defaultProjectId ?? projects[0]?.id;
                            this.isEditing = false;
                            this.entry = this.blank(defaultProjectId);
                            const preferredChapterId = this.entry.projectId === this.defaultProjectId ? this.defaultChapterId : undefined;
                            this.entry.chapterId = preferredChapterId;
                            this.loadChapterOptions(this.entry.projectId, preferredChapterId);
                        },
                        error: () => {
                            this.stopLoading();
                            this.state = 'error';
                        }
                    });
                    return;
                }
                this.entrySub = this.service.getEntryByDate(this.effectiveDate).subscribe({
                    next: existing => {
                        const defaultProjectId = existing?.projectId ?? this.defaultProjectId ?? projects[0]?.id;
                        this.isEditing = !!existing;
                        this.entry = existing
                            ? { ...existing, projectId: existing.projectId ?? defaultProjectId }
                            : this.blank(defaultProjectId);
                        const preferredChapterId = this.entry.projectId === this.defaultProjectId ? this.defaultChapterId : undefined;
                        this.entry.chapterId = this.entry.chapterId ?? preferredChapterId;
                        this.loadChapterOptions(this.entry.projectId, preferredChapterId);
                    },
                    error: () => {
                        this.stopLoading();
                        this.state = 'error';
                    }
                });
            },
            error: () => {
                this.stopLoading();
                this.state = 'error';
            }
        });
    }

    private blank(projectId?: string): Partial<DailyEntry> {
        return {
            date: this.effectiveDate,
            projectId,
            chapterId: this.defaultChapterId,
            words: undefined,
            sessions: 1,
            flow: undefined,
            note: undefined
        };
    }

    private loadChapterOptions(projectId: string | undefined, preferredChapterId?: string): void {
        this.chaptersSub?.unsubscribe();
        if (!projectId) {
            this.chapterOptions = [];
            this.chapterCount = 0;
            this.entry.chapterId = undefined;
            this.stopLoading();
            this.state = 'loaded';
            return;
        }
        this.chaptersSub = this.service.searchChapters(projectId).subscribe({
            next: chapters => {
                const sorted = [...chapters].sort((a, b) => a.no - b.no);
                this.chapterCount = sorted.length;
                const activeLabel = (s: string) =>
                    s === 'writing' ? ' (writing)' :
                    s === 'polishing' ? ' (polishing)' :
                    s === 'proofreading' ? ' (proofreading)' : '';
                this.chapterOptions = sorted.map(c => ({
                    label: `Ch. ${c.no} — ${c.title}${activeLabel(c.status)}`,
                    value: c.id
                }));
                this.entry.chapterId = this.resolveChapterId(sorted, this.entry.chapterId, preferredChapterId);
                this.stopLoading();
                this.state = 'loaded';
            },
            error: () => {
                this.stopLoading();
                this.state = 'error';
            }
        });
    }

    onProjectChange(projectId: string): void {
        this.entry.projectId = projectId;
        this.entry.chapterId = undefined;
        this.loadChapterOptions(projectId);
    }

    private resolveChapterId(chapters: Chapter[], currentId?: string, preferredId?: string): string | undefined {
        if (currentId && chapters.some(c => c.id === currentId)) return currentId;
        if (preferredId && chapters.some(c => c.id === preferredId)) return preferredId;
        return chapters.find(c => c.status === 'writing')?.id ??
            chapters.find(c => c.status === 'polishing')?.id ??
            chapters.find(c => c.status === 'proofreading')?.id ??
            chapters.find(c => c.status === 'pending')?.id ??
            chapters[0]?.id;
    }

    setFlow(value: WritingFlow): void {
        this.entry.flow = this.entry.flow === value ? undefined : value;
    }

    onCancel(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    onSave(): void {
        if (!this.hasEntryWork()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Nothing to save',
                detail: 'Add words before saving.'
            });
            return;
        }
        this.saving = true;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveEntry({
            ...this.entry,
            date: this.effectiveDate
        }).subscribe({
            next: saved => {
                this.saving = false;
                this.visible = false;
                this.visibleChange.emit(false);
                this.saved.emit(saved);
            },
            error: () => {
                this.saving = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save failed',
                    detail: 'Could not save this entry.'
                });
            }
        });
    }

    onVisibleChange(v: boolean): void {
        this.visibleChange.emit(v);
    }

    retry(): void {
        this.load();
    }

    onCreateProject(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.createProject.emit();
    }

    onOpenSelectedProject(): void {
        if (this.entry.projectId) {
            this.visible = false;
            this.visibleChange.emit(false);
            this.openProject.emit(this.entry.projectId);
        }
    }

    private hasEntryWork(): boolean {
        return (this.entry.words ?? 0) > 0;
    }

    private localDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private startLoading(): void {
        this.state = 'loading';
        this.showSkeleton = false;
        if (this.loadingTimer) clearTimeout(this.loadingTimer);
        this.loadingTimer = setTimeout(() => {
            if (this.state === 'loading') this.showSkeleton = true;
        }, 250);
    }

    private stopLoading(): void {
        if (this.loadingTimer) clearTimeout(this.loadingTimer);
        this.loadingTimer = undefined;
        this.showSkeleton = false;
    }

    get title(): string {
        return this.isToday ? "Log Today's Session" : this.isEditing ? 'Edit Entry' : 'Past Entry';
    }

    get isToday(): boolean {
        return this.effectiveDate === this.localDate(new Date());
    }

    get wordProgress(): number {
        if (!this.goals?.dailyWords || !this.entry.words) return 0;
        return Math.min(100, Math.round((this.entry.words / this.goals.dailyWords) * 100));
    }

    get loggedTodayWords(): number {
        return this.dayEntries.reduce((sum, entry) => sum + (entry.words || 0), 0);
    }

    get projectLoggedWords(): number {
        return this.dayEntries
            .filter(entry => entry.projectId === this.entry.projectId)
            .reduce((sum, entry) => sum + (entry.words || 0), 0);
    }

    get afterSaveProjectWords(): number {
        return this.projectLoggedWords + (this.entry.words || 0);
    }

    get selectedProjectTitle(): string {
        return this.projects.find(project => project.id === this.entry.projectId)?.title ?? 'Selected project';
    }

    ngOnDestroy(): void {
        this.loadSub?.unsubscribe();
        this.goalsSub?.unsubscribe();
        this.chaptersSub?.unsubscribe();
        this.saveSub?.unsubscribe();
        this.entrySub?.unsubscribe();
        this.stopLoading();
    }
}
