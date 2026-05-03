import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { Subscription, switchMap, of } from 'rxjs';

import { InkquestService } from '../../../../services/inkquest.service';
import { FilesUploadService } from '../../../../services/fileupload.service';
import { Chapter, ChapterStatus, DailyEntry, Project } from '../../../../models/inkquest.models';
import { appProperties } from '../../../../../app.properties';
import { InkquestEntryDialogComponent } from '../../components/inkquest-entry-dialog/inkquest-entry-dialog.component';
import { InkquestProjectDialogComponent } from '../../components/inkquest-project-dialog/inkquest-project-dialog.component';

type PageState = 'loading' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest-project-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        InputNumberModule,
        SelectModule,
        SkeletonModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        RippleModule,
        InkquestEntryDialogComponent,
        InkquestProjectDialogComponent
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './project-detail.component.html',
    styleUrls: ['./project-detail.component.scss']
})
export class InkquestProjectDetailComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    showSkeleton = false;
    project: Project | null = null;
    chapters: Chapter[] = [];
    selected: Chapter | null = null;
    chapterEntries: DailyEntry[] = [];
    loadingEntries = false;

    /** All projects for the switch dropdown */
    allProjects: Project[] = [];
    projectSwitchOptions: { label: string; value: string }[] = [];

    showDialog = false;
    saving = false;
    draft: Partial<Chapter> = {};
    isEditing = false;
    showProjectDialog = false;
    showEntryDialog = false;
    entryDialogChapterId?: string;

    /** Mobile drill-down: 'list' = chapter list, 'detail' = chapter detail */
    mobileView: 'list' | 'detail' = 'list';

    statusOptions = [
        { label: 'Pending',      value: 'pending'      },
        { label: 'Writing',      value: 'writing'      },
        { label: 'Polishing',    value: 'polishing'    },
        { label: 'Proofreading', value: 'proofreading' },
        { label: 'Finished',     value: 'finished'     }
    ];

    private static readonly COVER_GRADIENTS = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)',
        'linear-gradient(135deg, #fa709a, #fee140)',
        'linear-gradient(135deg, #a18cd1, #fbc2eb)',
        'linear-gradient(135deg, #ffecd2, #fcb69f)',
        'linear-gradient(135deg, #96fbc4, #f9f586)',
    ];

    private sub?: Subscription;
    private opSub?: Subscription;
    private uploadSub?: Subscription;
    private editSub?: Subscription;
    private loadingTimer?: ReturnType<typeof setTimeout>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private service: InkquestService,
        private filesUploadService: FilesUploadService,
        private confirm: ConfirmationService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.sub = this.route.params
            .pipe(
                switchMap(p => {
                    this.startLoading();
                    const id = p['id'] as string;
                    return this.service.getProject(id);
                })
            )
            .subscribe({
                next: project => {
                    this.stopLoading();
                    if (!project) {
                        this.state = 'error';
                        return;
                    }
                    this.project = project;
                    this.loadChapters(project.id);
                },
                error: () => {
                    this.stopLoading();
                    this.state = 'error';
                }
            });
    }

    private startLoading(): void {
        this.state = 'loading';
        this.showSkeleton = false;
        clearTimeout(this.loadingTimer);
        this.loadingTimer = setTimeout(() => {
            if (this.state === 'loading') this.showSkeleton = true;
        }, 250);
    }

    private stopLoading(): void {
        clearTimeout(this.loadingTimer);
        this.showSkeleton = false;
    }

    private loadChapters(projectId: string, preserveSelection = false): void {
        // Load sibling projects for the switch dropdown (silent, non-blocking)
        this.service.searchProjects().subscribe({
            next: projects => {
                this.allProjects = projects;
                this.projectSwitchOptions = projects.map(p => ({ label: p.title, value: p.id }));
            }
        });

        const previousId = this.selected?.id;

        this.service.searchChapters(projectId).subscribe({
            next: cs => {
                this.chapters = cs.sort((a, b) => a.no - b.no);

                // Preserve the previously-selected chapter (e.g. after saving an entry)
                // so writtenWords and history stay in context
                if (preserveSelection && previousId) {
                    this.selected = this.chapters.find(c => c.id === previousId)
                        ?? this.chapters.find(c => c.status === 'writing')
                        ?? this.chapters[0]
                        ?? null;
                } else {
                    this.selected = this.chapters.find(c => c.status === 'writing')
                        ?? this.chapters[0]
                        ?? null;
                }

                if (this.selected) this.loadChapterEntries(this.selected.id);
                // Always start on list view when loading a new project
                if (!preserveSelection) this.mobileView = 'list';
                this.state = 'loaded';
            },
            error: () => (this.state = 'error')
        });
    }

    /** Called when user picks a different project from the dropdown */
    switchProject(id: string): void {
        if (id && id !== this.project?.id) {
            this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`, id]);
        }
    }

    select(c: Chapter): void {
        this.selected = c;
        this.loadChapterEntries(c.id);
        // On mobile, switch to detail view after selecting
        if (window.innerWidth < 900) this.mobileView = 'detail';
    }

    /** Mobile only — go back to chapter list */
    backToChapterList(): void { this.mobileView = 'list'; }

    private loadChapterEntries(chapterId: string): void {
        this.chapterEntries = [];
        this.loadingEntries = true;
        this.service.searchEntriesByChapter(chapterId).subscribe({
            next: entries => {
                this.chapterEntries = entries.sort((a, b) => b.date.localeCompare(a.date));
                this.loadingEntries = false;
            },
            error: () => (this.loadingEntries = false)
        });
    }

    statusLabel(c: ChapterStatus): string {
        const map: Record<ChapterStatus, string> = {
            finished:     'Finished',
            writing:      'Writing',
            polishing:    'Polishing',
            proofreading: 'Proofreading',
            pending:      'Pending'
        };
        return map[c] ?? 'Pending';
    }

    statusClass(c: ChapterStatus): string {
        return `chapter-status-${c}`;
    }

    get activeChapter(): Chapter | null {
        return this.chapters.find(c => c.status === 'writing') ?? this.selected ?? this.chapters[0] ?? null;
    }

    get coverStyle(): Record<string, string> {
        if (!this.project) return {};
        if (this.project.cover) {
            return { 'background-image': `url("${this.filesUploadService.publicFileUrl(this.project.cover)}")`, 'background-size': 'cover', 'background-position': 'center' };
        }
        const idx = this.project.id.charCodeAt(this.project.id.length - 1) % InkquestProjectDetailComponent.COVER_GRADIENTS.length;
        return { 'background': InkquestProjectDetailComponent.COVER_GRADIENTS[idx] };
    }

    get coverInitial(): string {
        return this.project?.title.trim().charAt(0).toUpperCase() ?? '';
    }

    openAdd(): void {
        const next = (this.chapters[this.chapters.length - 1]?.no ?? 0) + 1;
        this.draft = {
            projectId: this.project?.id,
            no: next,
            title: `Chapter ${next}`,
            status: 'pending',
            goalWords: this.project?.defaultChapterGoal ?? 1000,
            writtenWords: 0
        };
        this.isEditing = false;
        this.showDialog = true;
    }

    openProjectEdit(): void {
        if (!this.project) return;
        this.showProjectDialog = true;
    }

    onProjectSaved(saved: Project): void {
        this.project = saved;
        this.showProjectDialog = false;
        // Reload chapters in case totalChapters changed
        this.loadChapters(saved.id, true);
    }

    openEdit(c: Chapter): void {
        const localChapter = this.chapters.find(chapter => chapter.id === c.id) ?? c;
        this.draft = this.toChapterDraft(localChapter);
        this.isEditing = true;
        this.showDialog = true;
        this.editSub?.unsubscribe();
        this.editSub = this.service.getChapter(c.id).subscribe({
            next: latest => {
                if (latest && this.showDialog && this.isEditing && this.draft.id === latest.id) {
                    this.draft = this.toChapterDraft(latest);
                }
            }
        });
    }

    save(): void {
        if (!this.draft.title?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Title required',
                detail: 'Enter a chapter title before saving.'
            });
            return;
        }
        if (!this.draft.no || this.draft.no < 1) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Chapter number required',
                detail: 'Enter a valid chapter number.'
            });
            return;
        }
        this.saving = true;
        this.opSub?.unsubscribe();
        this.opSub = this.service.saveChapter(this.draft).subscribe({
            next: () => {
                this.saving = false;
                this.showDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: this.isEditing ? 'Chapter saved' : 'Chapter added',
                    detail: this.isEditing ? 'Chapter details have been updated.' : 'New chapter has been added.'
                });
                if (this.project) this.loadChapters(this.project.id, this.isEditing);
            },
            error: () => {
                this.saving = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save failed',
                    detail: 'Could not save this chapter.'
                });
            }
        });
    }

    confirmDelete(c: Chapter): void {
        this.confirm.confirm({
            message: `Delete "${c.title}"? This cannot be undone.`,
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.service.deleteChapter(c.id).subscribe(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Chapter deleted',
                        detail: 'The chapter has been removed.'
                    });
                    if (this.project) this.loadChapters(this.project.id);
                });
            }
        });
    }

    confirmDeleteProject(): void {
        if (!this.project) return;
        const project = this.project;
        this.confirm.confirm({
            message: `Delete project "${project.title}" and all of its chapters? This cannot be undone.`,
            acceptLabel: 'Delete Project',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.service.deleteProject(project.id).subscribe(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Project deleted',
                        detail: 'The project has been removed.'
                    });
                    this.backToList();
                });
            }
        });
    }

    backToList(): void {
        this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`]);
    }

    logEntryForChapter(c: Chapter | null): void {
        if (!this.project || !c) return;
        this.entryDialogChapterId = c.id;
        this.showEntryDialog = true;
    }

    onEntrySaved(entry: DailyEntry): void {
        this.messageService.add({
            severity: "success",
            summary: "Entry saved",
            detail: entry.date === this.localDate(new Date()) ? "Today’s writing session has been logged." : "Past entry has been updated."
        });
        // preserveSelection=true keeps the user on the same chapter
        // so the updated writtenWords and entry history are shown immediately
        if (this.project) this.loadChapters(this.project.id, true);
    }

    onEntryCreateProject(): void {
        this.backToList();
    }

    onEntryOpenProject(projectId: string): void {
        if (!projectId) return;
        this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`, projectId]);
    }

    // ── Dual progress (word-based) ─────────────────────────
    get totalWrittenWords(): number {
        return this.chapters.reduce((s, c) => s + (c.writtenWords || 0), 0);
    }

    get totalGoalWords(): number {
        return this.chapters.reduce((s, c) => s + (c.goalWords || 0), 0);
    }

    get wordProgressPercent(): number {
        if (!this.totalGoalWords) return 0;
        return Math.min(100, Math.round((this.totalWrittenWords / this.totalGoalWords) * 100));
    }

    get remainingWords(): number {
        return Math.max(0, this.totalGoalWords - this.totalWrittenWords);
    }

    chapterProgress(c: Chapter): number {
        if (!c.goalWords) return 0;
        return Math.min(100, Math.round((c.writtenWords / c.goalWords) * 100));
    }

    private toChapterDraft(c: Chapter): Partial<Chapter> {
        return {
            ...c,
            goalWords: Number(c.goalWords ?? 0),
            writtenWords: Number(c.writtenWords ?? 0)
        };
    }

    private localDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.opSub?.unsubscribe();
        this.uploadSub?.unsubscribe();
        this.editSub?.unsubscribe();
        clearTimeout(this.loadingTimer);
    }
}
