import { Component, OnInit, ViewChild } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule, Popover } from 'primeng/popover';
import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import {NotificationsWidgetComponent} from "../app-notifications-widget/app.notification.widget.component";
import {ButtonDirective} from "primeng/button";

@Component({
    selector: 'app-notification-bell',
    standalone: true,
    imports: [CommonModule, BadgeModule, PopoverModule, NotificationsWidgetComponent, ButtonDirective],
    template: `
        <!--<button type="button" class="p-link layout-topbar-action relative" (click)="op.toggle($event)">
            <i class="pi pi-bell text-xl"></i>
            <p-badge *ngIf="unreadCount > 0" 
                     [value]="unreadCount.toString()" 
                     severity="danger" 
                     class="absolute -top-1 -right-1"></p-badge>
            <span class="ml-2 hidden md:inline">Notification</span>
        </button>-->
        <button pButton
                type="button"
                class="p-button-rounded p-button-text p-button-plain layout-topbar-action"
                (click)="op.toggle($event)">
            <i class="pi pi-bell"></i>
            <span class="ml-2 hidden md:inline">Notification</span>
        </button>

        <p-popover #op>
            <app-notifications-widget 
                    (countChanged)="unreadCount = $event"
                    (itemClicked)="op.hide()"
            />
        </p-popover>
    `
})
export class NotificationBellComponent implements OnInit {
    unreadCount = 0;
    @ViewChild('op') op!: Popover;

    constructor(private notiService: NotificationService, private userService: UserService) {}

    ngOnInit() {
        const userId = this.userService.getUser()?.id;
        if (userId) {
            this.notiService.getUnreadCount(userId).subscribe(count => this.unreadCount = count);
        }
    }
}