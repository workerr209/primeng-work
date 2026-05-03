import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../../services/inkquest.service';
import { FilesUploadService } from '../../../../services/fileupload.service';
import { Project } from '../../../../models/inkquest.models';

@Component({
    selector: 'app-inkquest-project-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './inkquest-project-dialog.component.html',
    styleUrls: ['./inkquest-project-dialog.component.scss']
})
export class InkquestProjectDialogComponent implements OnChanges, OnDestroy {
    /** Pass an existing project to edit it, leave undefined to create a new one. */
    @Input() visible = false;
    @Input() project?: Project;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() saved = new EventEmitter<Project>();

    draft: Partial<Project> = {};
    saving = false;
    coverUploading = false;
    submitted = false;

    private saveSub?: Subscription;
    private uploadSub?: Subscription;
    private projectSub?: Subscription;

    constructor(
        private service: InkquestService,
        private filesUploadService: FilesUploadService,
        private messageService: MessageService
    ) {}

    get isEditing(): boolean { return !!this.project?.id; }
    get title(): string { return this.isEditing ? 'Edit Project' : 'New Project'; }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible) {
            this.submitted = false;
            this.draft = this.isEditing
                ? this.toProjectDraft(this.project)
                : { title: '', cover: '', totalChapters: 20, summary: '', defaultChapterGoal: 1000 };
            this.loadLatestProjectDraft();
        }
    }

    coverStyle(): Record<string, string> {
        if (!this.draft.cover) return {};
        return {
            'background-image': `url("${this.filesUploadService.publicFileUrl(this.draft.cover)}")`,
            'background-size': 'cover',
            'background-position': 'center'
        };
    }

    get coverInitial(): string {
        return this.draft.title?.trim().charAt(0).toUpperCase() || '+';
    }

    onCoverUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            this.messageService.add({ severity: 'warn', summary: 'Invalid file', detail: 'Choose an image file.' });
            input.value = '';
            return;
        }
        this.coverUploading = true;
        this.uploadSub?.unsubscribe();
        this.uploadSub = this.filesUploadService.uploadFile(file).subscribe({
            next: ev => {
                if (ev.type === HttpEventType.Response) {
                    const fileName = ev.body?.fileName;
                    if (!fileName) throw new Error('Upload response missing fileName');
                    this.draft = { ...this.draft, cover: fileName };
                    this.messageService.add({ severity: 'success', summary: 'Cover uploaded' });
                }
            },
            error: () => {
                this.coverUploading = false;
                input.value = '';
                this.messageService.add({ severity: 'error', summary: 'Upload failed', detail: 'Could not upload the cover.' });
            },
            complete: () => { this.coverUploading = false; input.value = ''; }
        });
    }

    clearCover(): void { this.draft = { ...this.draft, cover: '' }; }

    save(): void {
        this.submitted = true;
        if (!this.isValid()) {
            this.messageService.add({ severity: 'warn', summary: 'Required fields', detail: 'Fill in the required project fields.' });
            return;
        }
        this.saving = true;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveProject(this.draft).subscribe({
            next: saved => {
                this.saving = false;
                this.visible = false;
                this.visibleChange.emit(false);
                this.saved.emit(saved);
                this.messageService.add({
                    severity: 'success',
                    summary: this.isEditing ? 'Project updated' : 'Project created',
                    detail: saved.title
                });
            },
            error: () => {
                this.saving = false;
                this.messageService.add({ severity: 'error', summary: 'Save failed', detail: 'Could not save the project.' });
            }
        });
    }

    cancel(): void {
        this.submitted = false;
        this.visible = false;
        this.visibleChange.emit(false);
    }

    titleInvalid(): boolean {
        return this.submitted && !this.draft.title?.trim();
    }

    totalChaptersInvalid(): boolean {
        return this.submitted && (!this.draft.totalChapters || this.draft.totalChapters < 1);
    }

    defaultChapterGoalInvalid(): boolean {
        return this.submitted && (!this.draft.defaultChapterGoal || this.draft.defaultChapterGoal < 1);
    }

    private isValid(): boolean {
        return !!this.draft.title?.trim() &&
            !!this.draft.totalChapters &&
            this.draft.totalChapters >= 1 &&
            !!this.draft.defaultChapterGoal &&
            this.draft.defaultChapterGoal >= 1;
    }

    private loadLatestProjectDraft(): void {
        this.projectSub?.unsubscribe();
        if (!this.project?.id) return;
        const projectId = this.project.id;
        this.projectSub = this.service.getProject(projectId).subscribe({
            next: latest => {
                if (latest && this.visible && this.project?.id === projectId) {
                    this.draft = this.toProjectDraft(latest);
                }
            }
        });
    }

    private toProjectDraft(project: Project | undefined): Partial<Project> {
        return {
            ...project,
            totalChapters: Number(project?.totalChapters ?? 20),
            defaultChapterGoal: project?.defaultChapterGoal === undefined ? undefined : Number(project.defaultChapterGoal),
            monthlyWordGoal: project?.monthlyWordGoal === undefined ? undefined : Number(project.monthlyWordGoal),
            weeklyWordGoal: project?.weeklyWordGoal === undefined ? undefined : Number(project.weeklyWordGoal)
        };
    }

    ngOnDestroy(): void {
        this.saveSub?.unsubscribe();
        this.uploadSub?.unsubscribe();
        this.projectSub?.unsubscribe();
    }
}
