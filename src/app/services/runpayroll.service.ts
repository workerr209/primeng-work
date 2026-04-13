import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {PayrollSummary} from "../models/payroll.model";

@Injectable({
    providedIn: 'root'
})
export class RunpayrollService {

    constructor() {}

    /**
     * สำหรับเรียกข้อมูล Mock รายการทั้งหมด (หน้า List)
     */
    getPayrollList(): Observable<PayrollSummary[]> {
        const mockList: PayrollSummary[] = [
            {
                id: '1',
                title: 'Payroll Filter - US -- Monthly US 01',
                type: 'Monthly',
                status: 'Completed',
                payDate: new Date('2026-04-01'),
                payPeriodStart: new Date('2026-03-01'),
                payPeriodEnd: new Date('2026-03-31'),
                estTotal: 120000,
                estTotalDiff: 0,
                employeeCount: 12,
                employeeDiff: 0,
                confidenceScore: 100,
                issues: [],
                actions: ['View', 'Cancel']
            },
            {
                id: '2',
                title: 'Payroll Filter - US Weekly -- Weekly 22/12/2025 - 4/1/2026 Pay 10/1',
                type: 'Weekly',
                status: 'Draft',
                payDate: new Date('2026-01-10'),
                payPeriodStart: new Date('2025-12-22'),
                payPeriodEnd: new Date('2026-01-04'),
                estTotal: 45000,
                estTotalDiff: 500,
                employeeCount: 10,
                employeeDiff: 1,
                confidenceScore: 85,
                issues: [],
                actions: ['Run']
            }
        ];
        return of(mockList);
    }

    /**
     * สำหรับเรียกข้อมูลตัวเดียว (หน้า Widget / Detail)
     */
    getPayrollSummaryById(id: string): Observable<PayrollSummary> {
        const mockDetail: PayrollSummary = {
            id: id,
            title: 'Bi-weekly Payroll',
            type: 'Bi-weekly',
            status: 'Draft',
            payDate: new Date('2026-04-01'),
            payPeriodStart: new Date('2026-03-16'),
            payPeriodEnd: new Date('2026-03-31'),
            estTotal: 120000,
            estTotalDiff: 2340,
            employeeCount: 12,
            employeeDiff: -2,
            confidenceScore: 78,
            lastRunDate: new Date('2026-03-10'),
            lastRunEmployees: 24,
            lastRunGross: 138420,
            issues: [
                { type: 'tax', label: 'Tax issues', count: 3 },
                { type: 'negative_netpay', label: 'Negative netpay', count: 1 },
                { type: 'missing_data', label: 'Missing data', count: 3 },
                { type: 'warning', label: 'Warnings', count: 6, status: 'checked' },
                { type: 'anomaly', label: 'Anomalies', count: 2, status: 'checked' }
            ],
            actions: ['Run']
        };
        return of(mockDetail);
    }
}