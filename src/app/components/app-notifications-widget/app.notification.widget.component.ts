import {
    Component,
    EventEmitter,
    OnInit,
    OnDestroy,
    Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../services/user.service';
import { appProperties } from '../../../app.properties';

import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ScrollPanelModule } from 'primeng/scrollpanel';

@Component({
    selector: 'app-notifications-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, BadgeModule, ScrollPanelModule],
    template: `
        <div class="card rounded flex flex-col bg-surface-0 dark:bg-surface-900 h-full">

            <!-- header -->
            <div class="p-4 flex justify-between items-center border-b border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-base sm:text-lg">Notifications</span>
                    <p-badge *ngIf="unreadCount > 0"
                             [value]="unreadCount"
                             severity="danger">
                    </p-badge>
                </div>

                <p-button label="Mark all read"
                          text
                          size="small"
                          (click)="readAll()"
                          [disabled]="unreadCount === 0">
                </p-button>
            </div>

            <!-- scroll area -->
            <p-scrollPanel class="flex-1 w-full h-[50vh]">
                <div class="flex flex-col">

                    <div *ngFor="let item of notifications; trackBy: trackById"
                         (click)="onNotiClick(item)"
                         class="p-4 border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/80 cursor-pointer transition-all">

                        <div class="flex gap-3 items-start">

                            <!-- dot -->
                            <div class="mt-1">
                                <div [class]="!item.read
                                    ? 'w-3 h-3 bg-blue-500 rounded-full shadow'
                                    : 'w-3 h-3 bg-surface-300 rounded-full'">
                                </div>
                            </div>

                            <!-- content -->
                            <div class="flex flex-col gap-1 flex-1 min-w-0">

                                <!-- title + time -->
                                <div class="flex justify-between items-start gap-2">
                                    <span
                                            class="text-sm truncate"
                                            [class]="!item.read
                                            ? 'font-semibold'
                                            : 'font-medium text-surface-600'">
                                        {{ item.title }}
                                    </span>

                                    <small class="text-xs text-surface-400 shrink-0">
                                        {{ item.createDate | date:'HH:mm' }}
                                    </small>
                                </div>

                                <!-- message -->
                                <p class="text-xs text-surface-500 m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {{ item.message }}
                                </p>

                                <!-- date -->
                                <div class="flex items-center gap-1 text-surface-400">
                                    <i class="pi pi-calendar text-xs"></i>
                                    <span class="text-xs">
                                        {{ item.createDate | date:'dd MMM yyyy' }}
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>

                    <!-- empty -->
                    <div *ngIf="notifications.length === 0"
                         class="p-6 text-center text-surface-400">
                        <i class="pi pi-bell-slash text-3xl mb-2"></i>
                        <p class="text-sm">No notifications yet</p>
                    </div>

                </div>
            </p-scrollPanel>

            <!-- footer -->
            <div class="p-2">
                <p-button label="View all activity"
                          text
                          size="small"
                          class="w-full">
                </p-button>
            </div>
        </div>
    `
})
export class NotificationsWidgetComponent implements OnInit, OnDestroy {

    notifications: any[] = [];
    unreadCount = 0;

    private destroy$ = new Subject<void>();

    @Output() countChanged = new EventEmitter<number>();
    @Output() itemClicked = new EventEmitter<void>();

    constructor(
        private notificationService: NotificationService,
        private router: Router,
        private userService: UserService
    ) {}

    ngOnInit() {
        const userId = this.userService.getUser()?.id;
        if (!userId) return;

        this.notificationService.getHistory(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => {
                this.notifications = data ?? [];
                this.updateUnreadCount();
            });

        this.notificationService.getNotificationStream(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => {
                this.notifications = [
                    { ...data, read: false },
                    ...this.notifications.slice(0, 19)
                ];
                this.updateUnreadCount();
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onNotiClick(item: any) {
        this.itemClicked.emit();

        if (!item.read && item.id) {
            item.read = true;

            this.notificationService.markAsRead(item.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe();

            this.updateUnreadCount();
        }

        if (item.url) {
            const segments = [
                appProperties.rootPath,
                item.url,
                item.parentId
            ].filter(Boolean);

            void this.router.navigate(segments, {
                state: { id: item.parentId }
            });
        }
    }

    readAll() {
        const userId = this.userService.getUser()?.id;
        if (!userId) return;

        this.notificationService.markAllAsRead(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.notifications = this.notifications.map(n => ({
                    ...n,
                    read: true
                }));
                this.updateUnreadCount();
            });
    }

    private updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.countChanged.emit(this.unreadCount);
    }

    trackById(index: number, item: any) {
        return item.id ?? index;
    }
}