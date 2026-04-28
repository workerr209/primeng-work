import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { InkNote } from '../../../models/inkquest.models';

type PageState = 'loading' | 'empty' | 'loaded' | 'error';
type PanelMode = 'idle' | 'view' | 'edit' | 'new';

@Component({
    selector: 'app-inkquest-notes',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, InputTextModule, TextareaModule,
        SkeletonModule, ConfirmDialogModule
    ],
    providers: [ConfirmationService],
    templateUrl: './notes.component.html',
    styleUrls: ['./notes.component.scss']
})
export class InkquestNotesComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    notes: InkNote[] = [];
    selected: InkNote | null = null;
    mode: PanelMode = 'idle';

    draft: Partial<InkNote> = {};
    saving = false;
    search = '';

    private sub?: Subscription;
    private opSub?: Subscription;

    constructor(
        private service: InkquestService,
        private confirm: ConfirmationService
    ) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.sub = this.service.getNotes().subscribe({
            next: notes => {
                this.notes = notes.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
                this.state = this.notes.length === 0 ? 'empty' : 'loaded';
            },
            error: () => (this.state = 'error')
        });
    }

    reload(): void { this.load(); }

    get filtered(): InkNote[] {
        const q = this.search.trim().toLowerCase();
        if (!q) return this.notes;
        return this.notes.filter(n =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            (n.tags ?? []).some(t => t.includes(q))
        );
    }

    select(n: InkNote): void {
        this.selected = n;
        this.mode = 'view';
    }

    newNote(): void {
        this.selected = null;
        this.draft = { title: '', content: '', tags: [] };
        this.mode = 'new';
        if (this.state === 'empty') this.state = 'loaded';
    }

    edit(): void {
        if (!this.selected) return;
        this.draft = { ...this.selected, tags: [...(this.selected.tags ?? [])] };
        this.mode = 'edit';
    }

    cancel(): void {
        this.mode = this.selected ? 'view' : 'idle';
    }

    save(): void {
        this.saving = true;
        this.opSub?.unsubscribe();
        const payload: Partial<InkNote> = {
            ...(this.mode === 'edit' && this.selected ? { id: this.selected.id, createdAt: this.selected.createdAt } : {}),
            ...this.draft
        };
        this.opSub = this.service.saveNote(payload).subscribe({
            next: saved => {
                this.saving = false;
                this.mode = 'view';
                this.selected = saved;   // show immediately from response
                this.load();             // reload list in background
            },
            error: () => (this.saving = false)
        });
    }

    confirmDelete(n: InkNote): void {
        this.confirm.confirm({
            message: `ลบโน้ต "${n.title}" ใช่ไหม?`,
            acceptLabel: 'ลบ',
            rejectLabel: 'ยกเลิก',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.service.deleteNote(n.id).subscribe(() => {
                    if (this.selected?.id === n.id) { this.selected = null; this.mode = 'idle'; }
                    this.load();
                });
            }
        });
    }

    tagsString(): string { return (this.draft.tags ?? []).join(', '); }
    setTags(val: string): void { this.draft.tags = val.split(',').map(t => t.trim()).filter(Boolean); }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.opSub?.unsubscribe();
    }
}
