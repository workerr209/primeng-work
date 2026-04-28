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
        SkeletonModule, DialogModule, InputNumberModule, TextareaModule
    ],
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
        private router: Router
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
        this.draft = { title: '', totalChapters: 20, summary: '' };
        this.showDialog = true;
    }

    save(): void {
        this.saving = true;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveProject(this.draft).subscribe({
            next: () => {
                this.saving = false;
                this.showDialog = false;
                this.load();
            },
            error: () => (this.saving = false)
        });
    }

    /** Returns full CSS background value — url() for real covers, gradient otherwise */
    coverBackground(p: Project): string {
        if (p.cover) return `url(${p.cover}) center/cover no-repeat`;
        const idx = p.id.charCodeAt(p.id.length - 1) % COVER_GRADIENTS.length;
        return COVER_GRADIENTS[idx];
    }

    coverInitial(p: Project): string {
        return p.title.trim().charAt(0).toUpperCase();
    }

    progressColor(p: Project): string {
        if (p.progressPercent >= 80) return '#10b981';
        if (p.progressPercent >= 40) return '#3b82f6';
        return '#f59e0b';
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.saveSub?.unsubscribe();
    }
}
