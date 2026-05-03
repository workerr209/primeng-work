export type ChapterStatus = 'finished' | 'writing' | 'polishing' | 'proofreading' | 'pending';
export type WritingFlow = 'fire' | 'ok' | 'slow';
export type DayQuality = 'good' | 'fair' | 'poor' | 'none';

export interface Chapter {
    id: string;
    projectId: string;
    no: number;
    title: string;
    status: ChapterStatus;
    goalWords: number;
    writtenWords: number;
    notes?: string;
    updatedAt: Date;
}

export interface Project {
    id: string;
    title: string;
    cover?: string;
    totalChapters: number;
    finishedChapters: number;
    progressPercent: number;
    updatedAt: Date;
    summary?: string;
    /** Default word-count goal applied to each new chapter */
    defaultChapterGoal?: number;
    /** Monthly word-count target for this project */
    monthlyWordGoal?: number;
    /** Weekly word-count target for this project */
    weeklyWordGoal?: number;
}

export interface DailyEntry {
    id: string;
    date: string;          // ISO yyyy-MM-dd
    projectId?: string;
    words: number;
    focusMinutes: number;
    sessions: number;
    chapterId?: string;
    flow?: WritingFlow;
    note?: string;
    quality?: DayQuality;
}

export interface DashboardSummary {
    todayScore: number;            // 0..100
    wordsToday: number;
    wordsGoal: number;
    focusToday: number;            // minutes
    focusGoal: number;             // minutes
    streakDays: number;
    consistencyGoal: number;
    weekly: { date: string; score: number; words: number }[];
    cumulative: { month: string; words: number }[];
    heatmap: { date: string; quality: DayQuality }[];
    currentProject?: Project;
    currentChapter?: Chapter;
}

function representativeChapter(chapters: Chapter[]): Chapter | undefined {
    if (!chapters.length) return undefined;

    const ordered = chapters.slice().sort((a, b) => a.no - b.no);
    return ordered.find(chapter => chapter.status !== 'finished')
        ?? ordered[0];
}

export function resolveProjectWordsGoal(
    project: Project,
    chapters: Chapter[] = [],
    fallbackGoal: number
): number {
    const chapterGoal = representativeChapter(chapters)?.goalWords;
    if (chapterGoal && chapterGoal > 0) return chapterGoal;
    if (project.defaultChapterGoal && project.defaultChapterGoal > 0) return project.defaultChapterGoal;
    return fallbackGoal;
}

export function buildInkquestSummaryProgress(
    summary: DashboardSummary,
    todayEntries: DailyEntry[],
    projects: Project[] = [],
    chaptersByProject: Record<string, Chapter[]> = {}
): DashboardSummary {
    const hasEntries = todayEntries.length > 0;
    const wordsToday = hasEntries
        ? todayEntries.reduce((sum, entry) => sum + (entry.words || 0), 0)
        : summary.wordsToday;
    const focusToday = hasEntries
        ? todayEntries.reduce((sum, entry) => sum + (entry.focusMinutes || 0), 0)
        : summary.focusToday;
    const activeProjects = projects.length > 0 ? projects : (summary.currentProject ? [summary.currentProject] : []);
    const projectCount = Math.max(1, activeProjects.length);
    const summedProjectWordsGoal = activeProjects.reduce((sum, project) => {
        return sum + resolveProjectWordsGoal(project, chaptersByProject[project.id] ?? [], summary.wordsGoal);
    }, 0);
    const wordsGoal = Math.max(1, summedProjectWordsGoal || summary.wordsGoal);
    const todayScore = Math.min(
        100,
        Math.round((wordsToday / wordsGoal) * 100)
    );

    return {
        ...summary,
        wordsToday,
        focusToday,
        wordsGoal,
        todayScore
    };
}

export interface WritingGoal {
    dailyWords: number;
    monthlyWords: number;
    dailyFocus: number;      // minutes
    streakTarget: number;    // days
}

export interface InkNote {
    id: string;
    title: string;
    content: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface InkSettings {
    defaultProjectId?: string;
    wordGoalReminder: boolean;
    reminderTime: string;        // HH:mm
    autoLogStreak: boolean;
    showWordCountInMenu: boolean;
}
