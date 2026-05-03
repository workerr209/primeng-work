import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    Chapter,
    ChapterStatus,
    DailyEntry,
    DashboardSummary,
    DayQuality,
    InkNote,
    InkSettings,
    Project,
    WritingFlow,
    WritingGoal
} from '../models/inkquest.models';

type LookupValue = number | string | { id?: number | string } | null | undefined;

interface BackendProject {
    id?: number | string;
    title?: string;
    cover?: string;
    totalChapters?: number | string;
    finishedChapters?: number | string;
    progressPercent?: number | string;
    updatedAt?: string | Date | number;
    updateDate?: string | Date | number;
    summary?: string;
    defaultChapterGoal?: number | string;
    monthlyWordGoal?: number | string;
    weeklyWordGoal?: number | string;
}

interface BackendChapter {
    id?: number | string;
    projectId?: LookupValue;
    chapterNo?: number | string;
    title?: string;
    status?: string;
    goalWords?: number | string;
    writtenWords?: number | string;
    notes?: string;
    updatedAt?: string | Date | number;
    updateDate?: string | Date | number;
}

interface BackendDailyEntry {
    id?: number | string;
    entryDate?: string | Date | number;
    date?: string;
    projectId?: LookupValue;
    chapterId?: LookupValue;
    words?: number | string;
    focusMinutes?: number | string;
    sessions?: number | string;
    flow?: string;
    note?: string;
    quality?: string;
}

interface BackendNote {
    id?: number | string;
    title?: string;
    content?: string;
    tags?: string[];
    createdAt?: string | Date | number;
    updatedAt?: string | Date | number;
}

interface BackendSettings {
    defaultProjectId?: LookupValue;
    wordGoalReminder?: boolean;
    reminderTime?: string;
    autoLogStreak?: boolean;
    showWordCountInMenu?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InkquestService {
    private readonly API_URL = `${environment.BASE_API_URL}/api/v1/inkquest`;

    constructor(private http: HttpClient) {}

    // ---------------------- Projects ----------------------
    searchProjects(): Observable<Project[]> {
        return this.http.post<BackendProject[]>(`${this.API_URL}/projects/search`, {})
            .pipe(map(list => (list ?? []).map(p => this.toProject(p))));
    }

    getProject(id: string): Observable<Project | undefined> {
        return this.http.get<BackendProject>(`${this.API_URL}/projects/${id}`)
            .pipe(
                map(p => this.toProject(p)),
                catchError(err => this.undefinedOn404<Project>(err))
            );
    }

    saveProject(payload: Partial<Project>): Observable<Project> {
        return this.http.post<BackendProject>(`${this.API_URL}/projects/save`, this.toBackendProject(payload))
            .pipe(map(p => this.toProject(p)));
    }

    deleteProject(id: string): Observable<boolean> {
        return this.http.delete(`${this.API_URL}/projects/${id}`)
            .pipe(map(() => true));
    }

    // ---------------------- Chapters ----------------------
    searchChapters(projectId: string): Observable<Chapter[]> {
        return this.http.get<BackendChapter[]>(`${this.API_URL}/chapters`, {
            params: { projectId }
        }).pipe(map(list => (list ?? []).map(c => this.toChapter(c))));
    }

    getChapter(id: string): Observable<Chapter | undefined> {
        return this.http.get<BackendChapter>(`${this.API_URL}/chapters/${id}`)
            .pipe(
                map(c => this.toChapter(c)),
                catchError(err => this.undefinedOn404<Chapter>(err))
            );
    }

    saveChapter(payload: Partial<Chapter>): Observable<Chapter> {
        return this.http.post<BackendChapter>(`${this.API_URL}/chapters/save`, this.toBackendChapter(payload))
            .pipe(map(c => this.toChapter(c)));
    }

    deleteChapter(id: string): Observable<boolean> {
        return this.http.delete(`${this.API_URL}/chapters/${id}`)
            .pipe(map(() => true));
    }

    // -------------------- Daily Entries --------------------
    searchEntries(criteria: Partial<DailyEntry> = {}): Observable<DailyEntry[]> {
        return this.http.post<BackendDailyEntry[]>(`${this.API_URL}/entries/search`, this.toBackendEntrySearch(criteria))
            .pipe(map(list => (list ?? []).map(e => this.toEntry(e))));
    }

    /** Returns all daily entries linked to a specific chapter, newest first. */
    searchEntriesByChapter(chapterId: string): Observable<DailyEntry[]> {
        return this.searchEntries({ chapterId });
    }

    getEntryByDate(date: string): Observable<DailyEntry | undefined> {
        return this.http.get<BackendDailyEntry>(`${this.API_URL}/entries/by-date/${date}`)
            .pipe(
                map(e => this.toEntry(e)),
                catchError(err => this.undefinedOn404<DailyEntry>(err))
            );
    }

    saveEntry(payload: Partial<DailyEntry>): Observable<DailyEntry> {
        return this.http.post<BackendDailyEntry>(`${this.API_URL}/entries/save`, this.toBackendEntry(payload))
            .pipe(map(e => this.toEntry(e)));
    }

    // ---------------------- Dashboard ----------------------
    getDashboard(): Observable<DashboardSummary | null> {
        return this.http.get<any>(`${this.API_URL}/dashboard`)
            .pipe(map(summary => this.toDashboard(summary)));
    }

    // ---------------------- Goals -------------------------
    getGoals(): Observable<WritingGoal> {
        return this.http.get<any>(`${this.API_URL}/goals`)
            .pipe(map(g => this.toGoals(g)));
    }

    saveGoals(g: WritingGoal): Observable<WritingGoal> {
        return this.http.post<any>(`${this.API_URL}/goals/save`, g)
            .pipe(map(saved => this.toGoals(saved)));
    }

    // ---------------------- Notes -------------------------
    getNotes(): Observable<InkNote[]> {
        return this.http.get<BackendNote[]>(`${this.API_URL}/notes`)
            .pipe(map(list => (list ?? []).map(n => this.toNote(n))));
    }

    saveNote(payload: Partial<InkNote>): Observable<InkNote> {
        return this.http.post<BackendNote>(`${this.API_URL}/notes/save`, this.toBackendNote(payload))
            .pipe(map(n => this.toNote(n)));
    }

    deleteNote(id: string): Observable<boolean> {
        return this.http.delete(`${this.API_URL}/notes/${id}`)
            .pipe(map(() => true));
    }

    // -------------------- Settings ------------------------
    getSettings(): Observable<InkSettings> {
        return this.http.get<BackendSettings>(`${this.API_URL}/settings`)
            .pipe(map(s => this.toSettings(s)));
    }

    saveSettings(s: InkSettings): Observable<InkSettings> {
        return this.http.post<BackendSettings>(`${this.API_URL}/settings/save`, this.toBackendSettings(s))
            .pipe(map(saved => this.toSettings(saved)));
    }

    private toProject(p: BackendProject): Project {
        return {
            id: this.asId(p.id),
            title: p.title ?? 'Untitled',
            cover: p.cover,
            totalChapters: this.asNumberValue(p.totalChapters),
            finishedChapters: this.asNumberValue(p.finishedChapters),
            progressPercent: this.asNumberValue(p.progressPercent),
            updatedAt: this.asDate(p.updatedAt ?? p.updateDate),
            summary: p.summary,
            defaultChapterGoal: this.asOptionalNumberValue(p.defaultChapterGoal),
            monthlyWordGoal: this.asOptionalNumberValue(p.monthlyWordGoal),
            weeklyWordGoal: this.asOptionalNumberValue(p.weeklyWordGoal)
        };
    }

    private toBackendProject(p: Partial<Project>): any {
        return {
            id: this.asNumber(p.id),
            title: p.title,
            cover: this.toCoverFileName(p.cover),
            summary: p.summary,
            totalChapters: p.totalChapters,
            finishedChapters: p.finishedChapters,
            progressPercent: p.progressPercent,
            defaultChapterGoal: p.defaultChapterGoal,
            monthlyWordGoal: p.monthlyWordGoal,
            weeklyWordGoal: p.weeklyWordGoal
        };
    }

    private toChapter(c: BackendChapter): Chapter {
        return {
            id: this.asId(c.id),
            projectId: this.asId(this.lookupId(c.projectId)),
            no: this.asNumberValue(c.chapterNo, 1),
            title: c.title ?? 'Untitled chapter',
            status: this.toChapterStatus(c.status),
            goalWords: this.asNumberValue(c.goalWords),
            writtenWords: this.asNumberValue(c.writtenWords),
            notes: c.notes,
            updatedAt: this.asDate(c.updatedAt ?? c.updateDate)
        };
    }

    private toBackendChapter(c: Partial<Chapter>): any {
        return {
            id: this.asNumber(c.id),
            projectId: this.asNumber(c.projectId),
            chapterNo: c.no,
            title: c.title,
            status: this.toBackendEnum(c.status),
            goalWords: c.goalWords,
            writtenWords: c.writtenWords,
            notes: c.notes
        };
    }

    private toEntry(e: BackendDailyEntry): DailyEntry {
        return {
            id: this.asId(e.id),
            date: this.asLocalDate(e.entryDate ?? e.date),
            projectId: this.optionalId(this.lookupId(e.projectId)),
            chapterId: this.optionalId(this.lookupId(e.chapterId)),
            words: this.asNumberValue(e.words),
            focusMinutes: this.asNumberValue(e.focusMinutes),
            sessions: this.asNumberValue(e.sessions, 1),
            flow: this.toWritingFlow(e.flow),
            note: e.note,
            quality: this.toDayQuality(e.quality)
        };
    }

    private toBackendEntry(e: Partial<DailyEntry>): any {
        return {
            id: this.asNumber(e.id),
            entryDate: e.date,
            projectId: this.asNumber(e.projectId),
            chapterId: this.asNumber(e.chapterId),
            words: e.words,
            focusMinutes: e.focusMinutes,
            sessions: e.sessions,
            flow: this.toBackendEnum(e.flow),
            note: e.note,
            quality: this.toBackendEnum(e.quality)
        };
    }

    private toBackendEntrySearch(criteria: Partial<DailyEntry>): any {
        return {
            projectId: this.asNumber(criteria.projectId),
            chapterId: this.asNumber(criteria.chapterId),
            dateFrom: criteria.date,
            dateTo: criteria.date
        };
    }

    private toDashboard(summary: any): DashboardSummary | null {
        if (!summary) return null;
        return {
            todayScore: this.asNumberValue(summary.todayScore),
            wordsToday: this.asNumberValue(summary.wordsToday),
            wordsGoal: this.asNumberValue(summary.wordsGoal),
            focusToday: this.asNumberValue(summary.focusToday),
            focusGoal: this.asNumberValue(summary.focusGoal),
            streakDays: this.asNumberValue(summary.streakDays),
            consistencyGoal: this.asNumberValue(summary.consistencyGoal),
            weekly: (summary.weekly ?? []).map((d: any) => ({
                date: d.date,
                score: this.asNumberValue(d.score),
                words: this.asNumberValue(d.words)
            })),
            cumulative: (summary.cumulative ?? []).map((d: any) => ({
                month: d.month,
                words: this.asNumberValue(d.words)
            })),
            heatmap: (summary.heatmap ?? []).map((d: any) => ({
                date: d.date,
                quality: this.toDayQuality(d.quality)
            })),
            currentProject: summary.currentProject ? this.toProject(summary.currentProject) : undefined,
            currentChapter: summary.currentChapter ? this.toChapter(summary.currentChapter) : undefined
        };
    }

    private toGoals(g: any): WritingGoal {
        return {
            dailyWords: this.asNumberValue(g?.dailyWords, 1000),
            monthlyWords: this.asNumberValue(g?.monthlyWords, 20000),
            dailyFocus: this.asNumberValue(g?.dailyFocus, 60),
            streakTarget: this.asNumberValue(g?.streakTarget, 7)
        };
    }

    private toNote(n: BackendNote): InkNote {
        return {
            id: this.asId(n.id),
            title: n.title ?? 'Untitled',
            content: n.content ?? '',
            tags: n.tags ?? [],
            createdAt: this.asDate(n.createdAt),
            updatedAt: this.asDate(n.updatedAt)
        };
    }

    private toBackendNote(n: Partial<InkNote>): any {
        return {
            id: this.asNumber(n.id),
            title: n.title,
            content: n.content,
            tags: n.tags ?? []
        };
    }

    private toSettings(s: BackendSettings): InkSettings {
        return {
            defaultProjectId: this.optionalId(this.lookupId(s?.defaultProjectId)),
            wordGoalReminder: !!s?.wordGoalReminder,
            reminderTime: s?.reminderTime ?? '20:00',
            autoLogStreak: !!s?.autoLogStreak,
            showWordCountInMenu: !!s?.showWordCountInMenu
        };
    }

    private toBackendSettings(s: InkSettings): any {
        return {
            defaultProjectId: this.asNumber(s.defaultProjectId),
            wordGoalReminder: s.wordGoalReminder,
            reminderTime: s.reminderTime,
            autoLogStreak: s.autoLogStreak,
            showWordCountInMenu: s.showWordCountInMenu
        };
    }

    private lookupId(value: LookupValue): string | number | undefined {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'object') return value.id;
        return value;
    }

    private asId(value: string | number | undefined): string {
        return value === undefined || value === null ? '' : String(value);
    }

    private toCoverFileName(cover: string | undefined): string | undefined {
        if (!cover) return cover;
        const marker = '/api/v1/files/public/';
        const markerIndex = cover.indexOf(marker);
        if (markerIndex >= 0) return decodeURIComponent(cover.slice(markerIndex + marker.length));

        const publicIndex = cover.indexOf('/public/');
        if (publicIndex >= 0) return decodeURIComponent(cover.slice(publicIndex + '/public/'.length));

        return cover;
    }

    private optionalId(value: string | number | undefined): string | undefined {
        return value === undefined || value === null ? undefined : String(value);
    }

    private asNumber(value: string | number | undefined): number | undefined {
        if (value === undefined || value === null || value === '') return undefined;
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
    }

    private asDate(value: string | Date | number | undefined): Date {
        return value ? new Date(value) : new Date();
    }

    private asLocalDate(value: string | Date | number | undefined): string {
        if (!value) return this.localDate(new Date());
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        return this.localDate(new Date(value));
    }

    private asNumberValue(value: string | number | undefined, fallback = 0): number {
        if (value === undefined || value === null || value === '') return fallback;
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    private asOptionalNumberValue(value: string | number | undefined): number | undefined {
        if (value === undefined || value === null || value === '') return undefined;
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
    }

    private localDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private toBackendEnum(value: string | undefined): string | undefined {
        return value?.toUpperCase();
    }

    private toChapterStatus(value: string | undefined): ChapterStatus {
        const v = value?.toLowerCase();
        if (v === 'finished' || v === 'writing' || v === 'polishing' || v === 'proofreading' || v === 'pending') return v;
        return 'pending';
    }

    private toWritingFlow(value: string | undefined): WritingFlow | undefined {
        const v = value?.toLowerCase();
        return v === 'fire' || v === 'ok' || v === 'slow' ? v : undefined;
    }

    private toDayQuality(value: string | undefined): DayQuality {
        const v = value?.toLowerCase();
        return v === 'good' || v === 'fair' || v === 'poor' || v === 'none' ? v : 'none';
    }

    private undefinedOn404<T>(err: unknown): Observable<T | undefined> {
        if (err instanceof HttpErrorResponse && err.status === 404) {
            return of(undefined);
        }
        throw err;
    }
}
