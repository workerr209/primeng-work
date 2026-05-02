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
        InkquestEntryDialogComponent
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

    showDialog = false;
    saving = false;
    draft: Partial<Chapter> = {};
    isEditing = false;
    showProjectDialog = false;
    projectSaving = false;
    projectDraft: Partial<Project> = {};
    projectCoverUploading = false;
    showEntryDialog = false;
    entryDialogChapterId?: string;

    statusOptions = [
        { label: 'Pending',  value: 'pending'  },
        { label: 'Writing',  value: 'writing'  },
        { label: 'Finished', value: 'finished' }
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

    private loadChapters(projectId: string): void {
        this.service.searchChapters(projectId).subscribe({
            next: cs => {
                this.chapters = cs.sort((a, b) => a.no - b.no);
                this.selected = this.chapters.find(c => c.status === 'writing') ?? this.chapters[0] ?? null;
                this.state = 'loaded';
            },
            error: () => (this.state = 'error')
        });
    }

    select(c: Chapter): void {
        this.selected = c;
    }

    statusLabel(c: ChapterStatus): string {
        return c === 'finished' ? 'Finished' : c === 'writing' ? 'Writing' : 'Pending';
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
            goalWords: 1000,
            writtenWords: 0
        };
        this.isEditing = false;
        this.showDialog = true;
    }

    openProjectEdit(): void {
        if (!this.project) return;
        this.projectDraft = { ...this.project };
        this.showProjectDialog = true;
    }

    projectDraftCoverStyle(): Record<string, string> {
        if (!this.projectDraft.cover) return {};
        return {
            'background-image': `url("${this.filesUploadService.publicFileUrl(this.projectDraft.cover)}")`,
            'background-size': 'cover',
            'background-position': 'center'
        };
    }

    onProjectCoverUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Invalid cover',
                detail: 'Choose an image file for the cover.'
            });
            input.value = '';
            return;
        }

        this.projectCoverUploading = true;
        this.uploadSub?.unsubscribe();
        this.uploadSub = this.filesUploadService.uploadFile(file).subscribe({
            next: event => {
                if (event.type === HttpEventType.Response) {
                    const fileName = event.body?.fileName;
                    if (!fileName) throw new Error('Upload response missing fileName');
                    this.projectDraft = { ...this.projectDraft, cover: fileName };
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Cover uploaded',
                        detail: 'Project cover has been uploaded.'
                    });
                }
            },
            error: () => {
                this.projectCoverUploading = false;
                input.value = '';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Upload failed',
                    detail: 'Could not upload this cover image.'
                });
            },
            complete: () => {
                this.projectCoverUploading = false;
                input.value = '';
            }
        });
    }

    clearProjectCover(): void {
        this.projectDraft = { ...this.projectDraft, cover: '' };
    }

    saveProject(): void {
        if (!this.project) return;
        if (!this.projectDraft.title?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Title required',
                detail: 'Enter a project title before saving.'
            });
            return;
        }
        this.projectSaving = true;
        this.opSub?.unsubscribe();
        this.opSub = this.service.saveProject(this.projectDraft).subscribe({
            next: saved => {
                this.project = saved;
                this.projectSaving = false;
                this.showProjectDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Project saved',
                    detail: 'Project details have been updated.'
                });
            },
            error: () => {
                this.projectSaving = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save failed',
                    detail: 'Could not save this project.'
                });
            }
        });
    }

    openEdit(c: Chapter): void {
        this.draft = { ...c };
        this.isEditing = true;
        this.showDialog = true;
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
                if (this.project) this.loadChapters(this.project.id);
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
            severity: 'success',
            summary: 'Entry saved',
            detail: entry.date === this.localDate(new Date()) ? 'Today’s writing session has been logged.' : 'Past entry has been updated.'
        });
        if (this.project) this.loadChapters(this.project.id);
    }

    onEntryCreateProject(): void {
        this.backToList();
    }

    onEntryOpenProject(projectId: string): void {
        if (!projectId) return;
        this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`, projectId]);
    }

    chapterProgress(c: Chapter): number {
        if (!c.goalWords) return 0;
        return Math.min(100, Math.round((c.writtenWords / c.goalWords) * 100));
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
        clearTimeout(this.loadingTimer);
    }
}
