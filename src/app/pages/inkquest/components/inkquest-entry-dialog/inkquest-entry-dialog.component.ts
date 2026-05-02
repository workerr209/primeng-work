import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Chapter, DailyEntry, WritingFlow } from '../../../../models/inkquest.models';

interface FlowOption { label: string; emoji: string; value: WritingFlow; }

@Component({
    selector: 'app-inkquest-entry-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        InputNumberModule,
        SelectModule,
        TextareaModule
    ],
    templateUrl: './inkquest-entry-dialog.component.html',
    styleUrls: ['./inkquest-entry-dialog.component.scss']
})
export class InkquestEntryDialogComponent implements OnChanges {
    @Input() visible = false;
    @Input() chapters: Chapter[] = [];
    @Input() defaultChapterId?: string;
    @Input() saving = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<Partial<DailyEntry>>();

    entry: Partial<DailyEntry> = {};
    chapterOptions: { label: string; value: string }[] = [];

    readonly flowOptions: FlowOption[] = [
        { label: 'Fire', emoji: '🔥', value: 'fire' },
        { label: 'Ok',   emoji: '😐', value: 'ok'   },
        { label: 'Slow', emoji: '🐢', value: 'slow'  }
    ];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['chapters']) {
            this.chapterOptions = this.chapters.map(c => ({
                label: `Ch. ${c.no} — ${c.title}${c.status === 'writing' ? ' (active)' : ''}`,
                value: c.id
            }));
        }
        if (changes['visible'] && this.visible) {
            this.entry = {
                chapterId: this.defaultChapterId,
                words: undefined,
                focusMinutes: undefined,
                sessions: 1,
                flow: undefined,
                note: undefined
            };
        }
    }

    setFlow(value: WritingFlow): void {
        this.entry.flow = this.entry.flow === value ? undefined : value;
    }

    onCancel(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    onSave(): void {
        this.save.emit({
            ...this.entry,
            date: new Date().toISOString().slice(0, 10)
        });
    }

    onVisibleChange(v: boolean): void {
        this.visibleChange.emit(v);
    }
}
