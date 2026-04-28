import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SkeletonModule } from 'primeng/skeleton';
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
        ToggleSwitchModule, SkeletonModule
    ],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class InkquestSettingsComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
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
    private saveSub?: Subscription;

    constructor(private service: InkquestService) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.service.getSettings().subscribe({
            next: s => {
                this.settings = s;
                this.draft = { ...s };
                this.service.searchProjects().subscribe(projects => {
                    this.projectOptions = [
                        { label: '— ไม่ระบุ —', value: '' },
                        ...projects.map(p => ({ label: p.title, value: p.id }))
                    ];
                    this.state = 'loaded';
                });
            },
            error: () => (this.state = 'error')
        });
    }

    reload(): void { this.load(); }

    save(): void {
        this.saving = true;
        this.saved = false;
        this.saveSub?.unsubscribe();
        this.saveSub = this.service.saveSettings(this.draft).subscribe({
            next: s => {
                this.settings = s;
                this.saving = false;
                this.saved = true;
                setTimeout(() => (this.saved = false), 3000);
            },
            error: () => (this.saving = false)
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.saveSub?.unsubscribe();
    }
}
