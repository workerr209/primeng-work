import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chapter, ChapterStatus, Project } from '../../../../models/inkquest.models';
import {Button} from "primeng/button";

interface ChecklistItem {
    label: string;
    sub?: string;
    status: ChapterStatus;
}

@Component({
    selector: 'app-inkquest-plot-progress',
    standalone: true,
    imports: [CommonModule, Button],
    templateUrl: './inkquest-plot-progress.component.html',
    styleUrls: ['./inkquest-plot-progress.component.scss']
})
export class InkquestPlotProgressComponent implements OnChanges {
    @Input()  project?: Project;
    @Input()  chapters: Chapter[] = [];
    @Output() projectClick = new EventEmitter<string>();

    checklist: ChecklistItem[] = [];

    ngOnChanges(_: SimpleChanges): void {
        this.buildChecklist();
    }

    private buildChecklist(): void {
        if (!this.chapters?.length) {
            this.checklist = [];
            return;
        }
        const activeIndex = Math.max(0, this.chapters.findIndex(c => c.status !== 'finished'));
        const start = Math.max(0, Math.min(activeIndex - 2, this.chapters.length - 5));
        this.checklist = this.chapters.slice(start, start + 5).map(c => ({
            label: `Ch ${c.no}`,
            sub: `${this.chapterProgress(c)}%`,
            status: c.status
        }));
    }

    onProjectClick(): void {
        if (this.project?.id) this.projectClick.emit(this.project.id);
    }

    statusClass(status: ChapterStatus): string {
        return `chapter-status-${status}`;
    }

    statusIcon(status: ChapterStatus): string {
        switch (status) {
            case 'finished': return 'pi-check';
            case 'writing':  return 'pi-circle-fill';
            default:         return 'pi-circle';
        }
    }

    get chapterProgressPercent(): number {
        const total = this.project?.totalChapters || this.chapters.length || 0;
        const finished = this.chapters.filter(c => c.status === 'finished').length || this.project?.finishedChapters || 0;
        return total ? this.clampPercent(Math.round((finished / total) * 100)) : 0;
    }

    get finishedChapters(): number {
        return this.chapters.filter(c => c.status === 'finished').length || this.project?.finishedChapters || 0;
    }

    get totalChapters(): number {
        return this.project?.totalChapters || this.chapters.length || 0;
    }

    get totalWrittenWords(): number {
        return this.chapters.reduce((sum, c) => sum + (c.writtenWords || 0), 0);
    }

    get totalGoalWords(): number {
        return this.chapters.reduce((sum, c) => sum + (c.goalWords || 0), 0);
    }

    get wordProgressPercent(): number {
        if (!this.totalGoalWords) return 0;
        return this.clampPercent(Math.round((this.totalWrittenWords / this.totalGoalWords) * 100));
    }

    get remainingWords(): number {
        return Math.max(0, this.totalGoalWords - this.totalWrittenWords);
    }

    chapterProgress(chapter: Chapter): number {
        if (!chapter.goalWords) return 0;
        return this.clampPercent(Math.round(((chapter.writtenWords || 0) / chapter.goalWords) * 100));
    }

    private clampPercent(value: number): number {
        return Math.max(0, Math.min(100, value));
    }
}
