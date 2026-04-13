
export interface PayrollIssue {
    type: 'tax' | 'negative_netpay' | 'missing_data' | 'warning' | 'anomaly';
    label: string;
    count: number;
    status?: 'checked' | 'pending';
}

export interface PayrollSummary {
    id: string;
    title: string; // สำหรับใช้ในหน้า List เช่น "Payroll Filter - US -- Monthly US 01"
    type: 'Bi-weekly' | 'Monthly' | 'Semi-monthly' | 'Weekly';
    status: 'Draft' | 'Processing' | 'Completed' | 'Overdue';
    payDate: Date;
    payPeriodStart: Date;
    payPeriodEnd: Date;
    estTotal: number;
    estTotalDiff: number;
    employeeCount: number;
    employeeDiff: number;
    confidenceScore: number;
    lastRunDate?: Date;
    lastRunEmployees?: number;
    lastRunGross?: number;
    issues: PayrollIssue[];
    actions: ('Run' | 'View' | 'Cancel')[]; // สำหรับหน้า List Prototype
}