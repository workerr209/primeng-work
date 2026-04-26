import {Component, OnInit} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {TagModule} from "primeng/tag";
import {Button} from "primeng/button";
import {PayrollSummary} from "../../models/payroll.model";
import {RunpayrollService} from "../../services/runpayroll.service";
import {firstValueFrom} from "rxjs";

@Component({
    selector: "app-payroll-widget",
    templateUrl: "./payroll-widget.component.html",
    imports: [
        RouterModule,
        CommonModule,
        TagModule,
        Button,
    ],
})
export class PayrollWidgetComponent implements OnInit {
    summary?: PayrollSummary;
    readonly circumference = 2 * Math.PI * 26;

    constructor(private payrollService: RunpayrollService) {}

    async ngOnInit(): Promise<void> {
        try {
            this.summary = await firstValueFrom(
                this.payrollService.getPayrollSummaryById("1"),
            );
        } catch (err: any) {
            console.error("ngOnInit failed", err);
        }
    }

    getScoreLabel(score: number): string {
        if (score >= 90) return "Excellent";
        if (score >= 75) return "Good";
        if (score >= 60) return "Fair";
        return "Needs Review";
    }

    getScoreColor(score: number): string {
        if (score >= 90) return "#22c55e";
        if (score >= 75) return "#f97316";
        if (score >= 60) return "#eab308";
        return "#ef4444";
    }

    getStrokeDashoffset(score: number): number {
        return this.circumference * (1 - score / 100);
    }

    getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        const map: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            Completed: "success",
            Processing: "info",
            Draft: "secondary",
            Overdue: "danger",
        };
        return map[status] ?? "secondary";
    }

    getIssueClass(type: string): string {
        const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ";
        const map: Record<string, string> = {
            tax:             "bg-red-100 text-red-600 border-red-200 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20",
            missing_data:    "bg-red-100 text-red-600 border-red-200 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20",
            negative_netpay: "bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-400/10 dark:text-orange-400 dark:border-orange-400/20",
            warning:         "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20",
            anomaly:         "bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-400/10 dark:text-purple-400 dark:border-purple-400/20",
        };
        return base + (map[type] ?? "bg-surface-100 text-muted-color border-surface dark:bg-surface-700 dark:text-surface-300 dark:border-surface-600");
    }
}