import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { RippleModule } from 'primeng/ripple';
import { Subscription, switchMap, of } from 'rxjs';

import { InkquestService } from '../../../../services/inkquest.service';
import { Chapter, ChapterStatus, Project } from '../../../../models/inkquest.models';
import { appProperties } from '../../../../../app.properties';

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
        ConfirmDialogModule,
        RippleModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './project-detail.component.html',
    styleUrls: ['./project-detail.component.scss']
})
export class InkquestProjectDetailComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    project: Project | null = null;
    chapters: Chapter[] = [];
    selected: Chapter | null = null;

    showDialog = false;
    saving = false;
    draft: Partial<Chapter> = {};
    isEditing = false;

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

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private service: InkquestService,
        private confirm: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.sub = this.route.params
            .pipe(
                switchMap(p => {
                    this.state = 'loading';
                    const id = p['id'] as string;
                    return this.service.getProject(id);
                })
            )
            .subscribe({
                next: project => {
                    if (!project) {
                        this.state = 'error';
                        return;
                    }
                    this.project = project;
                    this.loadChapters(project.id);
                },
                error: () => (this.state = 'error')
            });
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

    statusColor(c: ChapterStatus): string {
        return c === 'finished' ? '#10b981' : c === 'writing' ? '#a855f7' : 'rgba(160,160,180,0.45)';
    }

    statusLabel(c: ChapterStatus): string {
        return c === 'finished' ? 'Finished' : c === 'writing' ? 'Writing' : 'Pending';
    }

    get coverStyle(): Record<string, string> {
        if (!this.project) return {};
        if (this.project.cover) {
            return { 'background-image': `url(${this.project.cover})`, 'background-size': 'cover', 'background-position': 'center' };
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

    openEdit(c: Chapter): void {
        this.draft = { ...c };
        this.isEditing = true;
        this.showDialog = true;
    }

    save(): void {
        this.saving = true;
        this.opSub?.unsubscribe();
        this.opSub = this.service.saveChapter(this.draft).subscribe({
            next: () => {
                this.saving = false;
                this.showDialog = false;
                if (this.project) this.loadChapters(this.project.id);
            },
            error: () => (this.saving = false)
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
                    if (this.project) this.loadChapters(this.project.id);
                });
            }
        });
    }

    backToList(): void {
        this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`]);
    }

    chapterProgress(c: Chapter): number {
        if (!c.goalWords) return 0;
        return Math.min(100, Math.round((c.writtenWords / c.goalWords) * 100));
    }

    get progressFillColor(): string {
        if (!this.project) return '#3b82f6';
        const p = this.project.progressPercent;
        if (p >= 80) return '#10b981';
        if (p >= 40) return '#3b82f6';
        return '#f59e0b';
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.opSub?.unsubscribe();
    }
}
