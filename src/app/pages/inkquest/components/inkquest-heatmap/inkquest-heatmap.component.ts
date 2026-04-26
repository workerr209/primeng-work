import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DayQuality } from '../../../../models/inkquest.models';

interface Cell { date: string; quality: DayQuality; }

@Component({
    selector: 'app-inkquest-heatmap',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './inkquest-heatmap.component.html',
    styleUrls: ['./inkquest-heatmap.component.scss']
})
export class InkquestHeatmapComponent implements OnChanges {
    @Input() days: Cell[] = [];

    /** Each row corresponds to a day-of-week; columns are weeks. */
    rows: Cell[][] = [];
    monthLabels: { col: number; label: string }[] = [];

    readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    ngOnChanges(_: SimpleChanges): void {
        this.build();
    }

    private build(): void {
        if (!this.days?.length) {
            this.rows = [];
            this.monthLabels = [];
            return;
        }

        // Place each day in the grid by its day-of-week (Mon=0..Sun=6).
        const first = new Date(this.days[0].date);
        const startWeekday = (first.getDay() + 6) % 7; // Mon=0..Sun=6

        // Initialise 7 rows
        const rows: Cell[][] = Array.from({ length: 7 }, () => []);
        let row = startWeekday;
        let col = 0;

        for (const d of this.days) {
            // Pad earlier rows in the first column if start is mid-week
            while (rows[row].length < col) {
                rows[row].push({ date: '', quality: 'none' });
            }
            rows[row][col] = d;
            row++;
            if (row === 7) {
                row = 0;
                col++;
            }
        }

        // Pad remaining rows so all rows have the same length
        const maxLen = Math.max(...rows.map(r => r.length));
        for (const r of rows) {
            while (r.length < maxLen) r.push({ date: '', quality: 'none' });
        }
        this.rows = rows;

        // Compute month labels by scanning topmost row dates
        const monthFmt = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let prevMonth = -1;
        const labels: { col: number; label: string }[] = [];
        rows[0].forEach((cell, c) => {
            if (!cell.date) return;
            const m = new Date(cell.date).getMonth();
            if (m !== prevMonth) {
                labels.push({ col: c, label: monthFmt[m] });
                prevMonth = m;
            }
        });
        this.monthLabels = labels;
    }

    color(q: DayQuality): string {
        switch (q) {
            case 'good': return '#10b981';
            case 'fair': return '#f59e0b';
            case 'poor': return '#ef4444';
            default:     return 'rgba(120,120,140,0.18)';
        }
    }
}
