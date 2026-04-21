import {Component} from '@angular/core';
import {StatsWidget} from './components/statswidget';
import {
    NotificationsWidgetComponent
} from "../../conponents/app-notifications-widget/app.notification.widget.component";
import {PayrollWidgetComponent} from "../../conponents/app-payroll-widget/payroll-widget.component";
import {InkQuestWidgetComponent} from "../../conponents/app-inkquest-widget/inkquest-widget.component";
import {RevenueStreamWidget} from "./components/revenuestreamwidget";

@Component({
    selector: 'app-dashboard',
    imports: [StatsWidget, NotificationsWidgetComponent, PayrollWidgetComponent, InkQuestWidgetComponent],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <app-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <!--<app-recent-sales-widget />
                <app-best-selling-widget />-->
                <!--<app-revenue-stream-widget />-->
                <app-inkquest-widget/>
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-payroll-widget/>
                <app-notifications-widget/>
            </div>
        </div>
    `
})
export class Dashboard {}
