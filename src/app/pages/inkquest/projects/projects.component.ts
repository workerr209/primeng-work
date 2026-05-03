import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { catchError, forkJoin, map, of, Subscription, switchMap } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { FilesUploadService } from '../../../services/fileupload.service';
import { Chapter, Project } from '../../../models/inkquest.models';
import { appProperties } from '../../../../app.properties';
import { InkquestProjectDialogComponent } from '../components/inkquest-project-dialog/inkquest-project-dialog.component';

type PageState = 'loading' | 'empty' | 'loaded' | 'error';

interface ProjectListStats {
    totalChapters: number;
    finishedChapters: number;
    chapterProgress: number;
    writtenWords: number;
    goalWords: number;
    wordProgress: number;
    remainingWords: number;
}

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
        SkeletonModule,
        InkquestProjectDialogComponent
    ],
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.scss']
})
export class InkquestProjectsComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    showSkeleton = false;
    projects: Project[] = [];
    projectStats: Record<string, ProjectListStats> = {};
    search = '';
    showDialog = false;

    private sub?: Subscription;
    private loadingTimer?: ReturnType<typeof setTimeout>;

    constructor(
        private service: InkquestService,
        private filesUploadService: FilesUploadService,
        private router: Router
    ) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.state = 'loading';
        this.showSkeleton = false;
        clearTimeout(this.loadingTimer);
        this.loadingTimer = setTimeout(() => {
            if (this.state === 'loading') this.showSkeleton = true;
        }, 250);
        this.sub?.unsubscribe();
        this.sub = this.service.searchProjects().pipe(
            switchMap(list => {
                this.projects = list ?? [];
                if (this.projects.length === 0) return of([] as Chapter[][]);
                return forkJoin(
                    this.projects.map(project =>
                        this.service.searchChapters(project.id).pipe(
                            catchError(() => of([] as Chapter[]))
                        )
                    )
                );
            }),
            map(chapterGroups => this.buildProjectStats(chapterGroups))
        ).subscribe({
            next: stats => {
                clearTimeout(this.loadingTimer);
                this.showSkeleton = false;
                this.projectStats = stats;
                this.state = this.projects.length === 0 ? 'empty' : 'loaded';
            },
            error: () => {
                clearTimeout(this.loadingTimer);
                this.showSkeleton = false;
                this.state = 'error';
            }
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

    openNewDialog(): void { this.showDialog = true; }

    onProjectSaved(): void {
        this.showDialog = false;
        this.load();
    }

    coverStyle(p: Project): Record<string, string> {
        if (p.cover) {
            return {
                'background-image': `url("${this.filesUploadService.publicFileUrl(p.cover)}")`,
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

    stats(p: Project): ProjectListStats {
        return this.projectStats[p.id] ?? {
            totalChapters: p.totalChapters,
            finishedChapters: p.finishedChapters,
            chapterProgress: this.clampPercent(p.progressPercent),
            writtenWords: 0,
            goalWords: 0,
            wordProgress: 0,
            remainingWords: 0
        };
    }

    private buildProjectStats(chapterGroups: Chapter[][]): Record<string, ProjectListStats> {
        return this.projects.reduce<Record<string, ProjectListStats>>((acc, project, index) => {
            const chapters = chapterGroups[index] ?? [];
            const totalChapters = chapters.length || project.totalChapters || 0;
            const finishedChapters = chapters.length
                ? chapters.filter(c => c.status === 'finished').length
                : project.finishedChapters || 0;
            const writtenWords = chapters.reduce((sum, c) => sum + (c.writtenWords || 0), 0);
            const goalWords = chapters.reduce((sum, c) => sum + (c.goalWords || 0), 0);
            acc[project.id] = {
                totalChapters,
                finishedChapters,
                chapterProgress: totalChapters ? this.clampPercent(Math.round((finishedChapters / totalChapters) * 100)) : 0,
                writtenWords,
                goalWords,
                wordProgress: goalWords ? this.clampPercent(Math.round((writtenWords / goalWords) * 100)) : 0,
                remainingWords: Math.max(0, goalWords - writtenWords)
            };
            return acc;
        }, {});
    }

    private clampPercent(value: number | undefined): number {
        const n = value ?? 0;
        return Math.max(0, Math.min(100, n));
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        clearTimeout(this.loadingTimer);
    }
}
