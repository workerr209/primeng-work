import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {NotificationService} from '../../services/notification.service';
import {UserService} from '../../services/user.service';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {BadgeModule} from 'primeng/badge';
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {Router} from "@angular/router";
import {appProperties} from "../../../app.properties";

@Component({
    selector: 'app-notifications-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, BadgeModule, ScrollPanelModule],
    template: `
        <div class="card !mb-8 rounded flex flex-col bg-surface-0 dark:bg-surface-900">

            <div class="p-4 flex justify-between items-center border-b border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-lg">Notifications</span>
                    <p-badge *ngIf="unreadCount > 0" [value]="unreadCount" severity="danger"></p-badge>
                </div>
                <p-button label="Mark all read" text size="small" (click)="readAll()" [disabled]="unreadCount === 0"></p-button>
            </div>

            <p-scrollPanel [style]="{ width: '100%', height: '350px' }">
                <div class="flex flex-col">
                    <div *ngFor="let item of notifications"
                         (click)="onNotiClick(item)"
                         class="p-4 border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/80 cursor-pointer transition-all relative group">

                        <div class="flex gap-3">
                            <div class="mt-1.5">
                                <div [class]="!item.read ? 'w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'w-2.5 h-2.5 bg-surface-300 rounded-full'"></div>
                            </div>

                            <div class="flex flex-col gap-1 flex-1">
                                <div class="flex justify-between items-start">
                                    <span [class]="!item.read ? 'font-bold' : 'font-medium text-surface-600'" class="text-sm">
                                        {{ item.title }}
                                    </span>
                                    <small class="text-[10px] text-surface-400 font-semibold uppercase">
                                        {{ item.createDate | date:'HH:mm' }}
                                    </small>
                                </div>
                                <p class="text-xs m-0 text-surface-500 line-clamp-2">
                                    {{ item.message }}
                                </p>
                                <div class="flex items-center gap-1 mt-1 text-surface-400">
                                    <i class="pi pi-calendar text-[10px]"></i>
                                    <span class="text-[10px]">{{ item.createDate | date:'dd MMM yyyy' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="notifications.length === 0" class="p-8 text-center text-surface-400">
                        <i class="pi pi-bell-slash text-4xl mb-2"></i>
                        <p>No notifications yet</p>
                    </div>
                </div>
            </p-scrollPanel>

            <div class="p-2">
                <p-button label="View all activity" text size="small" class="w-full"></p-button>
            </div>
        </div>
    `
})
export class NotificationsWidgetComponent implements OnInit {
    notifications: any[] = [];
    unreadCount: number = 0;
    @Output() countChanged = new EventEmitter<number>();
    @Output() itemClicked = new EventEmitter<void>();

    constructor(private notificationService: NotificationService
        , private router: Router
        , private userService: UserService) {
    }

    ngOnInit() {
        const userId = this.userService.getUser()?.id;
        if (userId) {
            this.notificationService.getHistory(userId).subscribe(data => {
                this.notifications = data;
                this.updateUnreadCount();
            });

            this.notificationService.getNotificationStream(userId).subscribe(data => {
                this.notifications.unshift({ ...data, read: false });
                if (this.notifications.length > 20) this.notifications.pop();
                this.updateUnreadCount();
            });
        }
    }

    onNotiClick(item: any) {
        const target = item.url;
        this.itemClicked.emit();

        if (!item.read && item.id) {
            this.notificationService.markAsRead(item.id).subscribe();
            item.read = true;
            this.updateUnreadCount();
        }

        if (target) {
            const fullPath = `/${appProperties.rootPath}/${target}/${item.parentId}`;
            this.router.navigate([fullPath], {
                state: { id: item.parentId }
            }).then(() => console.log('Navigated to:', fullPath));
        }
    }

    private updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.countChanged.emit(this.unreadCount);
    }

    readAll() {
        const userId = this.userService.getUser()?.id;
        if (userId) {
            this.notificationService.markAllAsRead(userId).subscribe(() => {
                this.notifications.forEach(n => n.read = true);
                this.updateUnreadCount();
            });
        }
    }
}