import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { RippleModule } from 'primeng/ripple';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { Project } from '../../../models/inkquest.models';
import { appProperties } from '../../../../app.properties';

type PageState = 'loading' | 'empty' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest-projects',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        SkeletonModule,
        DialogModule,
        InputNumberModule,
        TextareaModule,
        RippleModule
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

    ngOnInit(): void {
        this.load();
    }

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
        this.router.navigate([`/${appProperties.rootPath}/inkquest/projects`, p.id]);
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

    coverFallback(p: Project): string {
        return p.cover || 'https://primefaces.org/cdn/primeng/images/demo/avatar/walter.jpg';
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
