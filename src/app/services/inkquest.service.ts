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

    constructor(private http: HttpClient) {}

    // ---------------------- Projects ----------------------
    /** TODO: this.http.post<Project[]>(`${this.API_URL}/projects/search`, {}) */
    searchProjects(): Observable<Project[]> {
        return of(this.mockProjects()).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.get<Project>(`${this.API_URL}/projects/${id}`) */
    getProject(id: string): Observable<Project | undefined> {
        return of(this.mockProjects().find(p => p.id === id)).pipe(
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
        return of(created).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.delete<boolean>(`${this.API_URL}/projects/${id}`) */
    deleteProject(id: string): Observable<boolean> {
        return of(true).pipe(delay(this.MOCK_DELAY));
    }

    // ---------------------- Chapters ----------------------
    /** TODO: this.http.get<Chapter[]>(`${this.API_URL}/chapters?projectId=${projectId}`) */
    searchChapters(projectId: string): Observable<Chapter[]> {
        return of(this.mockChapters().filter(c => c.projectId === projectId)).pipe(
            delay(this.MOCK_DELAY)
        );
    }

    /** TODO: this.http.get<Chapter>(`${this.API_URL}/chapters/${id}`) */
    getChapter(id: string): Observable<Chapter | undefined> {
        return of(this.mockChapters().find(c => c.id === id)).pipe(
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
        return of(c).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.delete<boolean>(`${this.API_URL}/chapters/${id}`) */
    deleteChapter(id: string): Observable<boolean> {
        return of(true).pipe(delay(this.MOCK_DELAY));
    }

    // -------------------- Daily Entries --------------------
    /** TODO: this.http.post<DailyEntry[]>(`${this.API_URL}/entries/search`, criteria) */
    searchEntries(): Observable<DailyEntry[]> {
        return of(this.mockEntries()).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.get<DailyEntry>(`${this.API_URL}/entries/by-date/${date}`) */
    getEntryByDate(date: string): Observable<DailyEntry | undefined> {
        return of(this.mockEntries().find(e => e.date === date)).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.post<DailyEntry>(`${this.API_URL}/entries/save`, payload) */
    saveEntry(payload: Partial<DailyEntry>): Observable<DailyEntry> {
        const e: DailyEntry = {
            id: payload.id ?? 'e-' + Date.now(),
            date: payload.date ?? new Date().toISOString().slice(0, 10),
            words: payload.words ?? 0,
            focusMinutes: payload.focusMinutes ?? 0,
            sessions: payload.sessions ?? 1,
            chapterId: payload.chapterId,
            flow: payload.flow,
            note: payload.note,
            quality: payload.quality
        };
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
    private mockProjects(): Project[] {
        return [
            {
                id: 'p-1',
                title: 'รักร้ายของนายมาเฟีย',
                cover: '/demo/inkquest/133924745.jpeg',
                totalChapters: 20,
                finishedChapters: 12,
                progressPercent: 60,
                updatedAt: new Date(),
                summary: 'นิยายโรแมนติกแนวมาเฟีย ตอนใหม่ทุกสัปดาห์'
            },
            {
                id: 'p-2',
                title: 'หัวขโมยแห่งหัวใจ',
                cover: '/demo/inkquest/134315316.jpeg',
                totalChapters: 18,
                finishedChapters: 8,
                progressPercent: 44,
                updatedAt: new Date()
            }
        ];
    }

    private mockChapters(): Chapter[] {
        const out: Chapter[] = [];
        const projectId = 'p-1';
        for (let i = 1; i <= 20; i++) {
            const status: Chapter['status'] =
                i <= 12 ? 'finished' : i === 13 ? 'writing' : 'pending';
            out.push({
                id: `${projectId}-c-${i}`,
                projectId,
                no: i,
                title: `ตอนที่ ${i}`,
                status,
                goalWords: 1000,
                writtenWords:
                    status === 'finished' ? 1000 : status === 'writing' ? 500 : 0,
                updatedAt: new Date()
            });
        }
        return out;
    }

    private mockEntries(): DailyEntry[] {
        const today = new Date();
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        const mk = (offset: number, words: number, focus: number): DailyEntry => {
            const d = new Date(today);
            d.setDate(today.getDate() - offset);
            return {
                id: 'e-' + offset,
                date: iso(d),
                words,
                focusMinutes: focus,
                sessions: 2,
                quality: this.toQuality(words, 1000)
            };
        };
        return [mk(0, 500, 45), mk(1, 1200, 70), mk(2, 700, 60)];
    }

    private mockDashboard(): DashboardSummary | null {
        // To test the empty state, return null here.
        const projects = this.mockProjects();
        const chapters = this.mockChapters();
        const project = projects[0];
        const currentChapter = chapters.find(c => c.status === 'writing');

        const wordsToday = 500;
        const wordsGoal = 1000;
        const focusToday = 45;
        const focusGoal = 60;
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
            streakDays: 3,
            consistencyGoal: 3,
            weekly: this.mockWeekly(),
            cumulative: this.mockCumulative(),
            heatmap: this.mockHeatmap(),
            currentProject: project,
            currentChapter
        };
    }

    private mockWeekly() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((d, i) => ({
            date: d,
            score: [72, 60, 85, 90, 75, 80, 68][i],
            words: [600, 350, 500, 600, 850, 700, 1000][i]
        }));
    }

    private mockCumulative() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
        const totals = [1200, 2300, 3100, 4200, 5000, 6500, 7500, 8500, 9500];
        return months.map((m, i) => ({ month: m, words: totals[i] }));
    }

    private mockHeatmap(): { date: string; quality: DayQuality }[] {
        const out: { date: string; quality: DayQuality }[] = [];
        const today = new Date();
        const pool: DayQuality[] = ['good', 'fair', 'poor', 'none', 'none'];
        for (let i = 180; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            out.push({
                date: d.toISOString().slice(0, 10),
                quality: pool[Math.floor(Math.random() * pool.length)]
            });
        }
        return out;
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
        return of(this.mockGoals()).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.post<WritingGoal>(`${this.API_URL}/goals/save`, g) */
    saveGoals(g: WritingGoal): Observable<WritingGoal> {
        return of(g).pipe(delay(this.MOCK_DELAY));
    }

    // ---------------------- Notes -------------------------
    /** TODO: this.http.get<InkNote[]>(`${this.API_URL}/notes`) */
    getNotes(): Observable<InkNote[]> {
        return of(this.mockNotes()).pipe(delay(this.MOCK_DELAY));
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
        return of(note).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.delete<boolean>(`${this.API_URL}/notes/${id}`) */
    deleteNote(id: string): Observable<boolean> {
        return of(true).pipe(delay(this.MOCK_DELAY));
    }

    // -------------------- Settings ------------------------
    /** TODO: this.http.get<InkSettings>(`${this.API_URL}/settings`) */
    getSettings(): Observable<InkSettings> {
        return of(this.mockSettings()).pipe(delay(this.MOCK_DELAY));
    }

    /** TODO: this.http.post<InkSettings>(`${this.API_URL}/settings/save`, s) */
    saveSettings(s: InkSettings): Observable<InkSettings> {
        return of(s).pipe(delay(this.MOCK_DELAY));
    }

    // ----------------------------------------------------------------
    // Mock seeds — Goals / Notes / Settings
    // ----------------------------------------------------------------
    private mockGoals(): WritingGoal {
        return { dailyWords: 1000, monthlyWords: 20000, dailyFocus: 60, streakTarget: 7 };
    }

    private mockNotes(): InkNote[] {
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

    private mockSettings(): InkSettings {
        return {
            defaultProjectId: 'p-1',
            wordGoalReminder: true,
            reminderTime: '20:00',
            autoLogStreak: true,
            showWordCountInMenu: false
        };
    }
}
