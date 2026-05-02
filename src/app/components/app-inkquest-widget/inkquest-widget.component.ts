import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../services/inkquest.service';
import { DashboardSummary } from '../../models/inkquest.models';
import { appProperties } from '../../../app.properties';
import { InkquestRingsComponent } from '../../pages/inkquest/components/inkquest-rings/inkquest-rings.component';

type WidgetState = 'loading' | 'empty' | 'loaded' | 'error';

@Component({
    selector: 'app-inkquest-widget',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        SkeletonModule,
        InkquestRingsComponent
    ],
    templateUrl: './inkquest-widget.component.html',
    styleUrls: ['./inkquest-widget.component.scss']
})
export class InkQuestWidgetComponent implements OnInit, OnDestroy {
    @Input() showRedirectButton = true;

    state: WidgetState = 'loading';
    showSkeleton = false;
    summary: DashboardSummary | null = null;

    readonly inkquestRoute = `/${appProperties.rootPath}/inkquest`;

    private sub?: Subscription;
    private loadingTimer?: ReturnType<typeof setTimeout>;

    constructor(private service: InkquestService) {}

    ngOnInit(): void { this.load(); }

    reload(): void { this.load(); }

    private load(): void {
        this.startLoading();
        this.sub?.unsubscribe();
        this.sub = this.service.getDashboard().subscribe({
            next: data => {
                this.stopLoading();
                this.summary = data;
                this.state = (!data || this.isEmpty(data)) ? 'empty' : 'loaded';
            },
            error: () => {
                this.stopLoading();
                this.state = 'error';
            }
        });
    }

    private startLoading(): void {
        this.state = 'loading';
        this.showSkeleton = false;
        clearTimeout(this.loadingTimer);
        this.loadingTimer = setTimeout(() => {
            if (this.state === 'loading') this.showSkeleton = true;
        }, 250);
    }

    private stopLoading(): void {
        clearTimeout(this.loadingTimer);
        this.showSkeleton = false;
    }

    private isEmpty(s: DashboardSummary): boolean {
        return !s.currentProject && s.wordsToday === 0 && s.focusToday === 0 && s.streakDays === 0;
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        clearTimeout(this.loadingTimer);
    }
}
