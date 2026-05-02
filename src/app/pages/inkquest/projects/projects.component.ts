import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { Project } from '../../../models/inkquest.models';
import { appProperties } from '../../../../app.properties';

type PageState = 'loading' | 'empty' | 'loaded' | 'error';

const COVER_GRADIENTS = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #ffecd2, #fcb69f)',
    'linear-gradient(135deg, #96fbc4, #f9f586)',
];

@Component({
    selector: 'app-inkquest-projects',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        ButtonModule, InputTextModule, IconFieldModule, InputIconModule,
        SkeletonModule, DialogModule, InputNumberModule, TextareaModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.scss']
})
export class InkquestProjectsComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    projects: Project[] = [];
    search = '';

    showDialog = false;
    saving = false;
    draft: Partial<Project> = {};

    private sub?: Subscription;
    private saveSub?: Subscription;

    constructor(
        private service: InkquestService,
        private router: Router,
        private messageService: MessageService
    ) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.sub = this.service.searchProjects().subscribe({
            next: list => {
                this.projects = list ?? [];
                this.state = this.projects.length === 0 ? 'empty' : 'loaded';
            },
            error: () => (this.state = 'error')
        });
    }

    reload(): void { this.load(); }

    filtered(): Project[] {
        const q = this.search.trim().toLowerCase();
        if (!q) return this.projects;
        return this.projects.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.summary?.toLowerCase().includes(q) ?? false)
        );
    }

    open(p: Project): void {
        void this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`, p.id]);
    }

    openNewDialog(): void {
        this.draft = { title: '', cover: '', totalChapters: 20, summary: '' };
        this.showDialog = true;
    }

    save(): void {
        if (!this.draft.title?.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Title required',
                detail: 'Enter a project title before saving.'
            });
            return;
        }
        this.saving = true;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveProject(this.draft).subscribe({
            next: () => {
                this.saving = false;
                this.showDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Project created',
                    detail: 'Your project has been added.'
                });
                this.load();
            },
            error: () => {
                this.saving = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save failed',
                    detail: 'Could not save this project.'
                });
            }
        });
    }

    coverStyle(p: Project): Record<string, string> {
        if (p.cover) {
            return {
                'background-image': `url("${p.cover}")`,
                'background-size': 'cover',
                'background-position': 'center'
            };
        }
        const idx = p.id.charCodeAt(p.id.length - 1) % COVER_GRADIENTS.length;
        return { 'background': COVER_GRADIENTS[idx] };
    }

    coverInitial(p: Project): string {
        return p.title.trim().charAt(0).toUpperCase();
    }

    draftCoverStyle(): Record<string, string> {
        if (!this.draft.cover) return {};
        return {
            'background-image': `url("${this.draft.cover}")`,
            'background-size': 'cover',
            'background-position': 'center'
        };
    }

    onCoverUpload(event: Event): void {
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

        const reader = new FileReader();
        reader.onload = () => {
            this.draft = { ...this.draft, cover: reader.result as string };
            input.value = '';
        };
        reader.onerror = () => {
            this.messageService.add({
                severity: 'error',
                summary: 'Upload failed',
                detail: 'Could not read this cover image.'
            });
            input.value = '';
        };
        reader.readAsDataURL(file);
    }

    clearCover(): void {
        this.draft = { ...this.draft, cover: '' };
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.saveSub?.unsubscribe();
    }
}
