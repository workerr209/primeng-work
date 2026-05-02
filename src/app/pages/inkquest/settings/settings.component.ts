import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { InkSettings, Project } from '../../../models/inkquest.models';
import { appProperties } from '../../../../app.properties';

type PageState = 'loading' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest-settings',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        ButtonModule, SelectModule, InputTextModule,
        ToggleSwitchModule, SkeletonModule, ToastModule
    ],
    providers: [MessageService],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class InkquestSettingsComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    showSkeleton = false;
    settings: InkSettings | null = null;
    draft: InkSettings = {
        wordGoalReminder: false,
        reminderTime: '20:00',
        autoLogStreak: true,
        showWordCountInMenu: false
    };
    projectOptions: { label: string; value: string }[] = [];
    saving = false;
    saved = false;

    readonly goalsRoute = `/${appProperties.rootPath}/inkquest/goals`;

    private sub?: Subscription;
    private projectsSub?: Subscription;
    private saveSub?: Subscription;
    private loadingTimer?: ReturnType<typeof setTimeout>;

    constructor(
        private service: InkquestService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.startLoading();
        this.sub?.unsubscribe();
        this.projectsSub?.unsubscribe();
        this.sub = this.service.getSettings().subscribe({
            next: s => {
                this.settings = s;
                this.draft = { ...s };
                this.projectsSub = this.service.searchProjects().subscribe({
                    next: projects => {
                        this.stopLoading();
                        this.projectOptions = [
                            { label: '— ไม่ระบุ —', value: '' },
                            ...projects.map(p => ({ label: p.title, value: p.id }))
                        ];
                        this.state = 'loaded';
                    },
                    error: () => {
                        this.stopLoading();
                        this.state = 'error';
                    }
                });
            },
            error: () => {
                this.stopLoading();
                this.state = 'error';
            }
        });
    }

    reload(): void { this.load(); }

    save(): void {
        if (this.draft.wordGoalReminder && !this.draft.reminderTime) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Reminder time required',
                detail: 'Choose a reminder time or turn off reminders.'
            });
            return;
        }
        this.saving = true;
        this.saved = false;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveSettings(this.draft).subscribe({
            next: s => {
                this.settings = s;
                this.saving = false;
                this.saved = true;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Settings saved',
                    detail: 'Ink Quest preferences have been updated.'
                });
                setTimeout(() => (this.saved = false), 3000);
            },
            error: () => {
                this.saving = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save failed',
                    detail: 'Could not save settings.'
                });
            }
        });
    }

    private startLoading(): void {
        this.state = 'loading';
        this.showSkeleton = false;
        if (this.loadingTimer) clearTimeout(this.loadingTimer);
        this.loadingTimer = setTimeout(() => {
            if (this.state === 'loading') this.showSkeleton = true;
        }, 250);
    }

    private stopLoading(): void {
        if (this.loadingTimer) clearTimeout(this.loadingTimer);
        this.loadingTimer = undefined;
        this.showSkeleton = false;
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.projectsSub?.unsubscribe();
        this.saveSub?.unsubscribe();
        this.stopLoading();
    }
}
