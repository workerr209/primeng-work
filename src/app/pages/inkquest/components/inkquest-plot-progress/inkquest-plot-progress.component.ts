import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chapter, ChapterStatus, Project } from '../../../../models/inkquest.models';
import {Button} from "primeng/button";

interface ChecklistItem {
    label: string;
    sub?: string;
    status: ChapterStatus;
    isFuture?: boolean;
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
        const finished = this.chapters.filter(c => c.status === 'finished');
        const writing  = this.chapters.find(c => c.status === 'writing');
        const pending  = this.chapters.filter(c => c.status === 'pending');

        const items: ChecklistItem[] = [];
        if (finished.length > 0) {
            items.push({ label: 'Finished', status: 'finished' });
        }
        const tail = finished.slice(-2);
        for (const c of tail) {
            items.push({ label: `Ch ${c.no}`, status: 'finished' });
        }
        if (writing) {
            items.push({ label: `Ch ${writing.no}`, sub: 'Writing', status: 'writing' });
        }
        if (pending.length > 0) {
            items.push({ label: 'Upcoming', status: 'pending', isFuture: true });
        }
        this.checklist = items.slice(0, 5);
    }

    onProjectClick(): void {
        if (this.project?.id) this.projectClick.emit(this.project.id);
    }

    statusColor(status: ChapterStatus): string {
        switch (status) {
            case 'finished': return '#10b981';
            case 'writing':  return '#a855f7';
            default:         return 'rgba(160,160,180,0.45)';
        }
    }

    statusIcon(status: ChapterStatus): string {
        switch (status) {
            case 'finished': return 'pi-check';
            case 'writing':  return 'pi-circle-fill';
            default:         return 'pi-circle';
        }
    }
}
