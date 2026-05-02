import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
    Chapter,
    DailyEntry,
    DashboardSummary,
    DayQuality,
    InkNote,
    InkSettings,
    Project,
    WritingGoal
} from '../models/inkquest.models';

/**
 * Ink Quest API service.
 *
 * NOTE: every method currently returns mock data via `of(...)` with a small
 * delay so the UI can show skeleton states realistically. Once the backend
 * endpoints are ready, replace each `of(...)` body with the corresponding
 * `this.http.*` call shown in the JSDoc above the method.
 */
@Injectable({ providedIn: 'root' })
export class InkquestService {
    private readonly API_URL = `${environment.BASE_API_URL}/api/v1/inkquest`;
    private readonly MOCK_DELAY = 600;

    // ── In-memory mock state (simulates backend persistence) ──
    private _goals: WritingGoal = { dailyWords: 1000, monthlyWords: 20000, dailyFocus: 60, streakTarget: 7 };
    private _settings: InkSettings = {
        defaultProjectId: 'p-1',
        wordGoalReminder: true,
        reminderTime: '20:00',
        autoLogStreak: true,
        showWordCountInMenu: false
    };
    private _projects: Project[] = this.seedProjects();
    private _chapters: Chapter[] = this.seedChapters();
    private _entries: DailyEntry[] = this.seedEntries();
    private _notes: InkNote[] = this.seedNotes();

    constructor(private http: HttpClient) {}

    // ---------------------- Projects ----------------------
    /** TODO: this.http.post<Project[]>(`${this.API_URL}/projects/search`, {}) */
    searchProjects(): Observable<Project[]> {
        return of(this.cloneProjects()).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.get<Project>(`${this.API_URL}/projects/${id}`) */
    getProject(id: string): Observable<Project | undefined> {
        const project = this._projects.find(p => p.id === id);
        return of(project ? this.cloneProject(project) : undefined).pipe(
            delay(this.MOCK_DELAY)
        );
    }

    /** TODO: this.http.post<Project>(`${this.API_URL}/projects/save`, payload) */
    saveProject(payload: Partial<Project>): Observable<Project> {
        const created: Project = {
            id: payload.id ?? 'p-' + Date.now(),
            title: payload.title ?? 'Untitled',
            cover: payload.cover,
            totalChapters: payload.totalChapters ?? 20,
            finishedChapters: payload.finishedChapters ?? 0,
            progressPercent: payload.progressPercent ?? 0,
            updatedAt: new Date(),
            summary: payload.summary
        };
        const idx = this._projects.findIndex(p => p.id === created.id);
        if (idx >= 0) {
            this._projects[idx] = created;
        } else {
            this._projects = [created, ...this._projects];
        }
        return of(created).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.delete<boolean>(`${this.API_URL}/projects/${id}`) */
    deleteProject(id: string): Observable<boolean> {
        this._projects = this._projects.filter(p => p.id !== id);
        this._chapters = this._chapters.filter(c => c.projectId !== id);
        this._entries = this._entries.filter(e => e.projectId !== id);
        if (this._settings.defaultProjectId === id) this._settings.defaultProjectId = this._projects[0]?.id;
        return of(true).pipe(delay(this.MOCK_DELAY));
    }

    // ---------------------- Chapters ----------------------
    /** TODO: this.http.get<Chapter[]>(`${this.API_URL}/chapters?projectId=${projectId}`) */
    searchChapters(projectId: string): Observable<Chapter[]> {
        return of(this.cloneChapters(this._chapters.filter(c => c.projectId === projectId))).pipe(
            delay(this.MOCK_DELAY)
        );
    }

    /** TODO: this.http.get<Chapter>(`${this.API_URL}/chapters/${id}`) */
    getChapter(id: string): Observable<Chapter | undefined> {
        const chapter = this._chapters.find(c => c.id === id);
        return of(chapter ? this.cloneChapter(chapter) : undefined).pipe(
            delay(this.MOCK_DELAY)
        );
    }

    /** TODO: this.http.post<Chapter>(`${this.API_URL}/chapters/save`, payload) */
    saveChapter(payload: Partial<Chapter>): Observable<Chapter> {
        const c: Chapter = {
            id: payload.id ?? 'c-' + Date.now(),
            projectId: payload.projectId ?? '',
            no: payload.no ?? 1,
            title: payload.title ?? 'Untitled chapter',
            status: payload.status ?? 'pending',
            goalWords: payload.goalWords ?? 1000,
            writtenWords: payload.writtenWords ?? 0,
            notes: payload.notes,
            updatedAt: new Date()
        };
        const idx = this._chapters.findIndex(ch => ch.id === c.id);
        if (idx >= 0) {
            this._chapters[idx] = c;
        } else {
            this._chapters = [...this._chapters, c];
        }
        this.syncProjectProgress(c.projectId);
        return of(c).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.delete<boolean>(`${this.API_URL}/chapters/${id}`) */
    deleteChapter(id: string): Observable<boolean> {
        const chapter = this._chapters.find(c => c.id === id);
        this._chapters = this._chapters.filter(c => c.id !== id);
        if (chapter) this.syncProjectProgress(chapter.projectId);
        return of(true).pipe(delay(this.MOCK_DELAY));
    }

    // -------------------- Daily Entries --------------------
    /** TODO: this.http.post<DailyEntry[]>(`${this.API_URL}/entries/search`, criteria) */
    searchEntries(): Observable<DailyEntry[]> {
        return of(this.cloneEntries()).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.get<DailyEntry>(`${this.API_URL}/entries/by-date/${date}`) */
    getEntryByDate(date: string): Observable<DailyEntry | undefined> {
        const entry = this._entries.find(e => e.date === date);
        return of(entry ? { ...entry } : undefined).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.post<DailyEntry>(`${this.API_URL}/entries/save`, payload) */
    saveEntry(payload: Partial<DailyEntry>): Observable<DailyEntry> {
        const idx = this._entries.findIndex(entry => entry.date === (payload.date ?? this.localDate(new Date())));
        const previous = idx >= 0 ? this._entries[idx] : undefined;
        const e: DailyEntry = {
            id: payload.id ?? 'e-' + Date.now(),
            date: payload.date ?? this.localDate(new Date()),
            projectId: payload.projectId ?? this.projectIdForChapter(payload.chapterId) ?? this._settings.defaultProjectId,
            words: payload.words ?? 0,
            focusMinutes: payload.focusMinutes ?? 0,
            sessions: payload.sessions ?? 1,
            chapterId: payload.chapterId,
            flow: payload.flow,
            note: payload.note,
            quality: payload.quality ?? this.toQuality(payload.words ?? 0, this._goals.dailyWords)
        };
        if (idx >= 0) {
            this._entries[idx] = e;
        } else {
            this._entries = [e, ...this._entries];
        }
        this.applyEntryChapterDelta(previous, e);
        return of(e).pipe(delay(this.MOCK_DELAY));
    }

    // ---------------------- Dashboard ----------------------
    /** TODO: this.http.get<DashboardSummary>(`${this.API_URL}/dashboard`) */
    getDashboard(): Observable<DashboardSummary | null> {
        return of(this.mockDashboard()).pipe(delay(this.MOCK_DELAY));
    }

    // ----------------------------------------------------------------
    // Mock seeds — delete when wiring real endpoints
    // ----------------------------------------------------------------
    private seedProjects(): Project[] {
        return [
            {
                id: 'p-1',
                title: 'รักร้ายของนายมาเฟีย',
                cover: 'assets/demo/inkquest/133924745.jpeg',
                totalChapters: 20,
                finishedChapters: 12,
                progressPercent: 60,
                updatedAt: new Date(),
                summary: 'นิยายโรแมนติกแนวมาเฟีย ตอนใหม่ทุกสัปดาห์'
            },
            {
                id: 'p-2',
                title: 'หัวขโมยแห่งหัวใจ',
                cover: 'assets/demo/inkquest/134315316.jpeg',
                totalChapters: 18,
                finishedChapters: 8,
                progressPercent: 44,
                updatedAt: new Date()
            }
        ];
    }

    private seedChapters(): Chapter[] {
        const out: Chapter[] = [];

        // p-1: 20 chapters, 12 finished, ch 13 writing
        for (let i = 1; i <= 20; i++) {
            const s: Chapter['status'] = i <= 12 ? 'finished' : i === 13 ? 'writing' : 'pending';
            out.push({
                id: `p-1-c-${i}`, projectId: 'p-1', no: i,
                title: `Chapter ${i}`,
                status: s, goalWords: 1000,
                writtenWords: s === 'finished' ? 1000 : s === 'writing' ? 500 : 0,
                updatedAt: new Date()
            });
        }

        // p-2: 18 chapters, 8 finished, ch 9 writing
        for (let i = 1; i <= 18; i++) {
            const s: Chapter['status'] = i <= 8 ? 'finished' : i === 9 ? 'writing' : 'pending';
            out.push({
                id: `p-2-c-${i}`, projectId: 'p-2', no: i,
                title: `Chapter ${i}`,
                status: s, goalWords: 1200,
                writtenWords: s === 'finished' ? 1200 : s === 'writing' ? 300 : 0,
                updatedAt: new Date()
            });
        }

        return out;
    }

    private seedEntries(): DailyEntry[] {
        const today = new Date();
        const mk = (offset: number, words: number, focus: number, sessions = 2): DailyEntry => {
            const d = new Date(today);
            d.setDate(today.getDate() - offset);
            return {
                id: 'e-' + offset, date: this.localDate(d),
                projectId: 'p-1',
                words, focusMinutes: focus, sessions,
                quality: this.toQuality(words, this._goals.dailyWords)
            };
        };
        // 14 days of realistic entries (some days skipped)
        return [
            mk(0,  500,  45, 1),
            mk(1, 1200,  70, 2),
            mk(2,  700,  60, 2),
            mk(3,    0,   0, 0),  // skipped day
            mk(4, 1050,  65, 2),
            mk(5,  850,  55, 2),
            mk(6,  980,  60, 2),
            mk(7, 1150,  75, 3),
            mk(8,    0,   0, 0),  // skipped day
            mk(9,  600,  40, 1),
            mk(10, 1300,  80, 3),
            mk(11,  750,  50, 2),
            mk(12,  900,  60, 2),
            mk(13, 1100,  70, 2),
        ];
    }

    private mockDashboard(): DashboardSummary | null {
        // To test the empty state, return null here.
        const projects = this._projects;
        const chapters = this._chapters;

        // Respect the saved defaultProjectId from Settings
        const defaultId = this._settings.defaultProjectId;
        const project = (defaultId ? projects.find(p => p.id === defaultId) : null) ?? projects[0];
        const currentChapter = chapters.filter(c => c.projectId === project?.id)
                                       .find(c => c.status === 'writing');

        const todayEntry = this.getTodayEntry();
        const wordsToday = todayEntry?.words ?? 0;
        const wordsGoal  = this._goals.dailyWords;   // ← from Goals state
        const focusToday = todayEntry?.focusMinutes ?? 0;
        const focusGoal  = this._goals.dailyFocus;   // ← from Goals state
        const todayScore = Math.min(
            100,
            Math.round(
                ((wordsToday / wordsGoal) * 0.6 + (focusToday / focusGoal) * 0.4) * 100
            )
        );

        /*return {
            todayScore : 0,
            wordsToday : 0,
            wordsGoal : 0,
            focusToday : 0,
            focusGoal : 0,
            streakDays: 0,
            consistencyGoal: 0,
            weekly: [],
            cumulative: [],
            heatmap: [],
            currentProject: undefined,
            currentChapter: undefined,
        };*/

        return {
            todayScore,
            wordsToday,
            wordsGoal,
            focusToday,
            focusGoal,
            streakDays: this.currentStreak(),
            consistencyGoal: this._goals.streakTarget,
            weekly: this.buildWeekly(),
            cumulative: this.buildCumulative(),
            heatmap: this.buildHeatmap(),
            currentProject: project ? this.cloneProject(project) : undefined,
            currentChapter: currentChapter ? this.cloneChapter(currentChapter) : undefined
        };
    }

    private buildWeekly() {
        const today = new Date();
        const dow = (today.getDay() + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - dow);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const iso = this.isoDate(d);
            const entry = this._entries.find(e => e.date === iso);
            const words = entry?.words ?? 0;
            return {
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                score: Math.min(100, Math.round((words / this._goals.dailyWords) * 100)),
                words
            };
        });
    }

    private buildCumulative() {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        let runningTotal = 0;
        return Array.from({ length: currentMonth + 1 }, (_, monthIndex) => {
            const words = this._entries
                .filter(e => {
                    const d = new Date(e.date);
                    return d.getFullYear() === currentYear && d.getMonth() === monthIndex;
                })
                .reduce((sum, e) => sum + e.words, 0);
            runningTotal += words;
            return {
                month: new Date(currentYear, monthIndex, 1).toLocaleDateString('en-US', { month: 'short' }),
                words: runningTotal
            };
        });
    }

    private buildHeatmap(): { date: string; quality: DayQuality }[] {
        const today = new Date();
        return Array.from({ length: 181 }, (_, idx) => {
            const i = 180 - idx;
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const date = this.isoDate(d);
            const entry = this._entries.find(e => e.date === date);
            return {
                date,
                quality: entry?.quality ?? this.toQuality(entry?.words ?? 0, this._goals.dailyWords)
            };
        });
    }

    private toQuality(words: number, goal: number): DayQuality {
        const ratio = words / goal;
        if (ratio >= 0.8) return 'good';
        if (ratio >= 0.4) return 'fair';
        if (ratio > 0)    return 'poor';
        return 'none';
    }

    // ---------------------- Goals -------------------------
    /** TODO: this.http.get<WritingGoal>(`${this.API_URL}/goals`) */
    getGoals(): Observable<WritingGoal> {
        return of({ ...this._goals }).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.post<WritingGoal>(`${this.API_URL}/goals/save`, g) */
    saveGoals(g: WritingGoal): Observable<WritingGoal> {
        this._goals = { ...g };
        return of({ ...this._goals }).pipe(delay(this.MOCK_DELAY));
    }

    // ---------------------- Notes -------------------------
    /** TODO: this.http.get<InkNote[]>(`${this.API_URL}/notes`) */
    getNotes(): Observable<InkNote[]> {
        return of(this.cloneNotes()).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.post<InkNote>(`${this.API_URL}/notes/save`, payload) */
    saveNote(payload: Partial<InkNote>): Observable<InkNote> {
        const note: InkNote = {
            id: payload.id ?? 'n-' + Date.now(),
            title: payload.title ?? 'Untitled',
            content: payload.content ?? '',
            tags: payload.tags ?? [],
            createdAt: payload.createdAt ?? new Date(),
            updatedAt: new Date()
        };
        const idx = this._notes.findIndex(n => n.id === note.id);
        if (idx >= 0) {
            this._notes[idx] = note;
        } else {
            this._notes = [note, ...this._notes];
        }
        return of(note).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.delete<boolean>(`${this.API_URL}/notes/${id}`) */
    deleteNote(id: string): Observable<boolean> {
        this._notes = this._notes.filter(n => n.id !== id);
        return of(true).pipe(delay(this.MOCK_DELAY));
    }

    // -------------------- Settings ------------------------
    /** TODO: this.http.get<InkSettings>(`${this.API_URL}/settings`) */
    getSettings(): Observable<InkSettings> {
        return of({ ...this._settings }).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.post<InkSettings>(`${this.API_URL}/settings/save`, s) */
    saveSettings(s: InkSettings): Observable<InkSettings> {
        this._settings = { ...s };
        return of({ ...this._settings }).pipe(delay(this.MOCK_DELAY));
    }

    // ----------------------------------------------------------------
    // Mock seeds — Goals / Notes / Settings
    // ----------------------------------------------------------------
    private seedNotes(): InkNote[] {
        return [
            {
                id: 'note-1',
                title: 'Character Development — มาเฟีย',
                content: 'ตัวละครเอกต้องมีความขัดแย้งภายในกับตัวเองเยอะกว่านี้\n\n- ฉากที่เขาเห็นรูปครอบครัว\n- บทสนทนาในรถกับนางเอก\n- Flashback ตอนเด็ก',
                tags: ['character', 'plot'],
                createdAt: new Date('2026-04-01'),
                updatedAt: new Date('2026-04-10')
            },
            {
                id: 'note-2',
                title: 'Plot Outline — Act 2',
                content: 'ฉากการเผชิญหน้าครั้งแรกระหว่างมาเฟียกับคู่แข่ง\n\nต้องสร้าง tension ให้สูงขึ้นเรื่อยๆ ก่อนถึง climax ตอนที่ 15',
                tags: ['plot', 'structure'],
                createdAt: new Date('2026-04-15'),
                updatedAt: new Date('2026-04-20')
            },
            {
                id: 'note-3',
                title: 'Research — มาเฟียอิตาลี',
                content: 'ข้อมูลที่ต้องการ:\n- โครงสร้างองค์กร\n- ศัพท์ภาษาอิตาลีที่ใช้\n- ระบบ hierarchy ของ boss → capo → soldier',
                tags: ['research'],
                createdAt: new Date('2026-04-22'),
                updatedAt: new Date('2026-04-25')
            }
        ];
    }

    private getTodayEntry(): DailyEntry | undefined {
        return this._entries.find(e => e.date === this.localDate(new Date()));
    }

    private isoDate(d: Date): string {
        return this.localDate(d);
    }

    private localDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private projectIdForChapter(chapterId: string | undefined): string | undefined {
        if (!chapterId) return undefined;
        return this._chapters.find(c => c.id === chapterId)?.projectId;
    }

    private applyEntryChapterDelta(previous: DailyEntry | undefined, next: DailyEntry): void {
        const touchedProjectIds = new Set<string>();
        if (previous?.chapterId) {
            const oldChapter = this._chapters.find(c => c.id === previous.chapterId);
            if (oldChapter) {
                oldChapter.writtenWords = Math.max(0, oldChapter.writtenWords - previous.words);
                oldChapter.updatedAt = new Date();
                touchedProjectIds.add(oldChapter.projectId);
            }
        }

        if (next.chapterId) {
            const newChapter = this._chapters.find(c => c.id === next.chapterId);
            if (newChapter) {
                newChapter.writtenWords = Math.min(newChapter.goalWords, newChapter.writtenWords + next.words);
                newChapter.updatedAt = new Date();
                touchedProjectIds.add(newChapter.projectId);
            }
        }

        touchedProjectIds.forEach(projectId => this.syncProjectProgress(projectId));
    }

    private currentStreak(): number {
        const loggedDates = new Set(
            this._entries
                .filter(e => e.words > 0 || e.focusMinutes > 0)
                .map(e => e.date)
        );
        const cursor = new Date();
        if (!loggedDates.has(this.localDate(cursor))) {
            cursor.setDate(cursor.getDate() - 1);
        }

        let streak = 0;
        while (loggedDates.has(this.localDate(cursor))) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    }

    private syncProjectProgress(projectId: string): void {
        const project = this._projects.find(p => p.id === projectId);
        if (!project) return;
        const chapters = this._chapters.filter(c => c.projectId === projectId);
        const totalChapters = chapters.length;
        const finishedChapters = chapters.filter(c => c.status === 'finished').length;
        project.totalChapters = totalChapters;
        project.finishedChapters = finishedChapters;
        project.progressPercent = totalChapters ? Math.round((finishedChapters / totalChapters) * 100) : 0;
        project.updatedAt = new Date();
    }

    private cloneProjects(): Project[] {
        return this._projects.map(p => this.cloneProject(p));
    }

    private cloneProject(p: Project): Project {
        return { ...p, updatedAt: new Date(p.updatedAt) };
    }

    private cloneChapters(chapters: Chapter[]): Chapter[] {
        return chapters.map(c => this.cloneChapter(c));
    }

    private cloneChapter(c: Chapter): Chapter {
        return { ...c, updatedAt: new Date(c.updatedAt) };
    }

    private cloneEntries(): DailyEntry[] {
        return this._entries.map(e => ({ ...e }));
    }

    private cloneNotes(): InkNote[] {
        return this._notes.map(n => ({
            ...n,
            tags: [...(n.tags ?? [])],
            createdAt: new Date(n.createdAt),
            updatedAt: new Date(n.updatedAt)
        }));
    }

}
