import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {StyleClassModule} from "primeng/styleclass";
import {BadgeModule} from "primeng/badge";
import {OverlayBadgeModule} from "primeng/overlaybadge";
import {PayrollSummary} from "../../models/payroll.model";
import {RunpayrollService} from "../../services/runpayroll.service";
import {TagModule} from "primeng/tag";
import {firstValueFrom} from "rxjs";
import {Button} from "primeng/button";

@Component({
    selector: "app-payroll-widget",
    templateUrl: "./payroll-widget.component.html",
    imports: [
        RouterModule,
        CommonModule,
        StyleClassModule,
        BadgeModule,
        TagModule,
        OverlayBadgeModule,
        Button,
    ],
})
export class PayrollWidgetComponent implements OnInit {
    summary?: PayrollSummary;

    constructor(private payrollService: RunpayrollService) {
    }

    async ngOnInit(): Promise<void> {
        try {
            this.summary = await firstValueFrom(
                this.payrollService.getPayrollSummaryById("1"),
            );
        } catch (err: any) {
            console.error("ngOnInit failed", err);
        }
    }

    getIssueClass(type: string): string {
        const base =
            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ";
        const theme: Record<string, string> = {
            tax: "bg-red-900/20 text-red-400 border-red-900/50",
            missing_data: "bg-red-900/20 text-red-400 border-red-900/50",
            negative_netpay: "bg-orange-900/20 text-orange-400 border-orange-900/50",
            warning: "bg-yellow-900/20 text-yellow-400 border-yellow-900/50",
            anomaly: "bg-purple-900/20 text-purple-400 border-purple-900/50",
        };

        return base + (theme[type] || "bg-gray-800 text-gray-400");
    }
}
