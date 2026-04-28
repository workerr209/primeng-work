import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';

import { InkquestService } from '../../../services/inkquest.service';
import { DashboardSummary, DailyEntry, DayQuality } from '../../../models/inkquest.models';
import { InkquestStatsChartComponent, StatsChartData } from '../components/inkquest-stats-chart/inkquest-stats-chart.component';

type PageState = 'loading' | 'empty' | 'loaded' | 'error';
interface StatCard { label: string; value: string | number; unit: string; icon: string; color: string; }

@Component({
    selector: 'app-inkquest-stats',
    standalone: true,
    imports: [CommonModule, TabsModule, SkeletonModule, ButtonModule, InkquestStatsChartComponent],
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.scss']
})
export class InkquestStatsComponent implements OnInit, OnDestroy {
    state: PageState = 'loading';
    activeTab = '0';

    summary: DashboardSummary | null = null;
    entries: DailyEntry[] = [];

    weeklyCards: StatCard[] = [];
    monthlyCards: StatCard[] = [];
    yearlyCards: StatCard[] = [];

    weeklyChart: StatsChartData | null = null;
    monthlyChart: StatsChartData | null = null;
    yearlyChart: StatsChartData | null = null;

    private sub?: Subscription;

    constructor(private service: InkquestService) {}

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.state = 'loading';
        this.sub?.unsubscribe();
        this.sub = this.service.getDashboard().subscribe({
            next: summary => {
                this.summary = summary;
                this.service.searchEntries().subscribe({
                    next: entries => {
                        this.entries = entries.sort((a, b) => b.date.localeCompare(a.date));
                        if (!summary && !entries.length) { this.state = 'empty'; return; }
                        this.buildAll();
                        this.state = 'loaded';
                    },
                    error: () => (this.state = 'error')
                });
            },
            error: () => (this.state = 'error')
        });
    }

    reload(): void { this.load(); }

    // ── Date context labels ───────────────────────────────────
    get weekDateRange(): string {
        const today = new Date();
        const dow = (today.getDay() + 6) % 7;   // Mon=0
        const mon = new Date(today); mon.setDate(today.getDate() - dow);
        const sun = new Date(mon);   sun.setDate(mon.getDate() + 6);
        const fmt = (d: Date) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        return `${fmt(mon)} – ${fmt(sun)}`;
    }

    get monthLabel(): string {
        return new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    }

    get yearLabel(): string {
        return new Date().getFullYear().toString();
    }

    // ── Entry display helpers ─────────────────────────────────
    qualityColor(q: DayQuality | undefined): string {
        switch (q) {
            case 'good': return '#10b981';
            case 'fair': return '#f59e0b';
            case 'poor': return '#ef4444';
            default:     return 'var(--text-color-secondary)';
        }
    }

    flowEmoji(f: string | undefined): string {
        return f === 'fire' ? '🔥' : f === 'ok' ? '😐' : f === 'slow' ? '🐢' : '—';
    }

    private buildAll(): void {
        const weekly = this.summary?.weekly ?? [];
        const cumulative = this.summary?.cumulative ?? [];

        // ── Weekly ──────────────────────────────────────
        const wTotal = weekly.reduce((s, d) => s + d.words, 0);
        const wAvg   = weekly.length ? Math.round(wTotal / weekly.length) : 0;
        const wBest  = weekly.reduce((m, d) => d.words > m ? d.words : m, 0);
        this.weeklyCards = [
            { label: 'คำรวมสัปดาห์นี้', value: wTotal.toLocaleString(), unit: 'คำ',  icon: 'pi-pencil',    color: '#3b82f6' },
            { label: 'เฉลี่ย/วัน',       value: wAvg.toLocaleString(),   unit: 'คำ',  icon: 'pi-chart-bar', color: '#8b5cf6' },
            { label: 'วันที่ดีที่สุด',    value: wBest.toLocaleString(),  unit: 'คำ',  icon: 'pi-star',      color: '#f59e0b' },
            { label: 'Streak',             value: this.summary?.streakDays ?? 0, unit: 'วัน', icon: 'pi-bolt', color: '#ef4444' }
        ];
        this.weeklyChart = { labels: weekly.map(d => d.date), values: weekly.map(d => d.words), color: '#3b82f6', type: 'bar' };

        // ── Monthly ─────────────────────────────────────
        const mCurrent = cumulative.length >= 2
            ? cumulative[cumulative.length - 1].words - cumulative[cumulative.length - 2].words
            : cumulative.length === 1 ? cumulative[0].words : 0;
        const mPrevRaw = cumulative.length >= 3
            ? cumulative[cumulative.length - 2].words - cumulative[cumulative.length - 3].words
            : 0;
        const mGrowth = mPrevRaw ? Math.round(((mCurrent - mPrevRaw) / mPrevRaw) * 100) : 0;
        this.monthlyCards = [
            { label: 'คำเดือนนี้',      value: mCurrent.toLocaleString(), unit: 'คำ', icon: 'pi-pencil',      color: '#10b981' },
            { label: 'เทียบเดือนก่อน',  value: (mGrowth >= 0 ? '+' : '') + mGrowth, unit: '%', icon: 'pi-trending-up', color: mGrowth >= 0 ? '#10b981' : '#ef4444' },
            { label: 'วันที่บันทึก',     value: this.entries.length, unit: 'วัน', icon: 'pi-calendar', color: '#8b5cf6' },
            { label: 'เฉลี่ย/วัน',       value: Math.round(mCurrent / 30).toLocaleString(), unit: 'คำ', icon: 'pi-chart-line', color: '#f59e0b' }
        ];
        // per-month delta so the chart matches the "Words this month" stat card
        const monthlyDeltas = cumulative.map((c, i) =>
            i === 0 ? c.words : c.words - cumulative[i - 1].words
        );
        this.monthlyChart = { labels: cumulative.map(c => c.month), values: monthlyDeltas, color: '#10b981', type: 'bar' };

        // ── Yearly ──────────────────────────────────────
        const yTotal = cumulative.length ? cumulative[cumulative.length - 1].words : 0;
        this.yearlyCards = [
            { label: 'คำรวมปีนี้',       value: yTotal.toLocaleString(), unit: 'คำ',    icon: 'pi-book',      color: '#ec4899' },
            { label: 'เฉลี่ย/เดือน',     value: cumulative.length ? Math.round(yTotal / 12).toLocaleString() : '0', unit: 'คำ', icon: 'pi-chart-bar', color: '#f59e0b' },
            { label: 'เดือนที่บันทึก',   value: cumulative.length, unit: 'เดือน', icon: 'pi-calendar', color: '#3b82f6' },
            { label: 'Projects ทั้งหมด', value: 2, unit: 'เรื่อง', icon: 'pi-book', color: '#8b5cf6' }
        ];
        this.yearlyChart = { labels: cumulative.map(c => c.month), values: cumulative.map(c => c.words), color: '#ec4899', type: 'bar' };
    }

    ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
