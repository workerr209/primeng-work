export type ChapterStatus = 'finished' | 'writing' | 'pending';
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
