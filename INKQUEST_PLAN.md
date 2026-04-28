# Ink Quest — Handoff Summary

> Drop this file in front of a fresh Claude (Sonnet) session so it can pick up
> where Opus left off without re-asking questions that have already been
> answered. Read this **before** writing any code.

---

## 1. Project context

- **Stack:** Angular 19 (standalone components), PrimeNG 19 with Aura theme,
  Tailwind 3 utility classes, SCSS, RxJS.
- **App skeleton:** Sakai-NG admin template. Routes are nested under
  `AppLayout` at `/${appProperties.rootPath}` (current value: `sakai`).
- **Key folders that exist already:**
  - `src/app/models/` — interfaces (use `*.model.ts` or `*.models.ts`)
  - `src/app/services/` — HTTP services (`*.service.ts`)
  - `src/app/components/` — shared UI components
  - `src/app/pages/` — page-level routes (each subfolder owns its own
    `*.routes.ts`)
  - `src/app/layout/` — shell + menu + topbar
- The user's preferred Thai/English mix in UI is fine. Don't over-translate.

## 2. Module being built — Ink Quest

A writing tracker / dashboard for novelists. Reference design = "Novel Writer"
mockups the user provided (dark theme, neon accents, rings, heatmap, plot
progress, daily entry dialog, etc.).

### 2.1 Decisions already made (do NOT re-litigate)

| Topic | Decision |
|---|---|
| Folder for interfaces | `src/app/models/inkquest.models.ts` (plural `models`) |
| Folder for service | `src/app/services/inkquest.service.ts` |
| Service shape | HttpClient-style API methods; every method currently returns `of(mockData)` with comments showing the eventual `this.http.*` call |
| Dashboard widget location | `src/app/components/app-inkquest-widget/` (existing folder reused; selector `app-inkquest-widget`, class `InkQuestWidgetComponent`) |
| Main page location | `src/app/pages/inkquest/inkquest.component.{ts,html,scss}` |
| Sub-components for main page | Under `src/app/pages/inkquest/components/<name>/<name>.component.{ts,html,scss}` |
| Module routing | `src/app/pages/inkquest/inkquest.routes.ts` — currently 1 route only |
| Lazy-loaded under | `/sakai/inkquest` (registered in `src/app.routes.ts`) |
| Menu | A new sidebar group **"Ink Quest"** with one item **"Overview"** added in `src/app/layout/component/app.menu.ts` |
| Naming | "Dashboard" stays only in **Home** group. Inside Ink Quest, the page is called **"Overview"** |
| Calendar menu | **Cut.** Heatmap covers it. Don't add. |
| File size policy | Keep each file small. If a section grows, extract a sub-component. |
| Selector / class for the new widget vs old simple widget | The old simple bar-chart widget was **replaced in place** — same folder `app-inkquest-widget/`, same selector `app-inkquest-widget`, same class name `InkQuestWidgetComponent`. The richer version (rings + plot progress + redirect button) overwrote it. |

### 2.2 Files that exist and what they do

```
src/app/
├── models/
│   └── inkquest.models.ts              ← Project, Chapter, DailyEntry,
│                                          DashboardSummary, ChapterStatus,
│                                          WritingFlow, DayQuality
├── services/
│   └── inkquest.service.ts             ← InkquestService — full CRUD signatures
│                                          for projects/chapters/entries +
│                                          getDashboard(); all return mock data
│                                          via of(...).pipe(delay(600))
├── components/
│   └── app-inkquest-widget/            ← reused folder, replaced contents
│       ├── inkquest-widget.component.ts     selector: app-inkquest-widget
│       ├── inkquest-widget.component.html   states: loading/empty/loaded/error
│       └── inkquest-widget.component.scss   ring layout
└── pages/
    └── inkquest/
        ├── inkquest.routes.ts          ← single route → InkquestComponent
        ├── inkquest.component.{ts,html,scss}    main orchestrator
        └── components/
            ├── inkquest-rings/         ← 4 large doughnut rings
            ├── inkquest-plot-progress/ ← progress bar + chapter checklist
            ├── inkquest-progress-chart/← daily/cumulative line chart
            ├── inkquest-heatmap/       ← 180-day grid + legend
            └── inkquest-entry-dialog/  ← + Add Today's Entry modal
```

### 2.3 Conventions to follow when adding new pages

**Routing**

- Each new page is a child route in `inkquest.routes.ts`, e.g.:
  ```ts
  { path: 'projects',         component: ProjectsComponent,       data: { breadcrumb: 'Projects' } },
  { path: 'projects/:id',     component: ProjectDetailComponent,  data: { breadcrumb: 'Project Detail' } },
  ```
  ⚠️ Add new routes BEFORE the `{ path: '**', redirectTo: '/notfound' }`
  catch-all.
- The lazy registration in `src/app.routes.ts` is already in place — you do NOT
  re-register at the app level.

**Menu**

- Add child items inside the existing **Ink Quest** group in `app.menu.ts`.
  Use Thai labels when matching the original Novel Writer reference; English
  is fine for menu names. Example:
  ```ts
  { label: 'Projects',    icon: 'pi pi-fw pi-book',     routerLink: [`/${appProperties.rootPath}/inkquest/projects`] },
  ```

**Component pattern**

- Standalone Angular components, `OnPush` is fine but not required.
- File trio: `.ts` + `.html` + `.scss` (templateUrl/styleUrls).
- Use **PrimeNG** widgets first (`p-table`, `p-dialog`, `p-select`,
  `p-skeleton`, `p-button`). Use Tailwind utilities for layout.
- Theme: do **not** hard-code colors. Use `var(--text-color)`,
  `var(--text-color-secondary)`, `var(--surface-border)`, `--p-primary-*`.
  Tailwind utilities like `dark:bg-surface-700` are already wired by the
  template.
- Charts must subscribe to `LayoutService.configUpdate$.pipe(debounceTime(50))`
  to redraw on theme switches (see `inkquest-rings`/`inkquest-progress-chart`).

**State machine for pages**

Each page should support **4 states** identical to the existing widget:
`loading` (skeleton blocks) / `empty` / `error` (with Retry) / `loaded`.
Skeletons use `p-skeleton`. See `inkquest-widget.component.html` for the
canonical pattern; copy it.

**Service pattern**

- Methods return `Observable<T>`. Internally `of(mock).pipe(delay(600))`.
- Above each method, JSDoc `/** TODO: this.http.<verb>(`${this.API_URL}/...`) */`.
- Mock data lives in `private mock<Thing>()` methods at the bottom of the
  service. Real backend swap = delete the mocks, replace `of(...)` bodies
  with `this.http.*`.

**Sub-components vs page**

- Page (`*.component.ts`) is **only** an orchestrator: load data, hold state,
  pass `@Input` props to children, listen to `@Output` events, navigate.
- Sub-components are dumb: they accept inputs, render, emit events. No
  service injection in sub-components unless absolutely necessary.

**File size guideline**

- If a `.html` file exceeds ~200 lines or `.ts` exceeds ~150 lines,
  consider extracting a sub-component into `pages/inkquest/components/...`.

## 3. What's done

- [x] Models (`inkquest.models.ts`)
- [x] Service with full CRUD mock (`inkquest.service.ts`)
- [x] Dashboard widget (used in main app dashboard, links to Ink Quest overview)
- [x] **Overview** page (the main `inkquest.component`) with rings + plot
      progress + chart + heatmap + Add Today's Entry dialog
- [x] Routes wired (`/sakai/inkquest`)
- [x] Menu group **Ink Quest > Overview**

## 4. What's NOT done — open work

User shortlisted these (Calendar already cut). Final priority order to ask
before starting:

| # | Page | Notes |
|---|---|---|
| 1 | **Projects** (list) | Grid of novel cards with cover/progress/updatedAt + search + "+ New Project" button. Route: `/sakai/inkquest/projects`. |
| 2 | **Project Detail** | Header (title, cover, progress) + Chapter list (left) + Chapter detail (right) + add/edit/delete chapter dialogs. Route: `/sakai/inkquest/projects/:id`. |
| 3 | **Daily Entry** | Full page version of the existing dialog. Words/Focus/Sessions sliders + chapter selector + note. Route: `/sakai/inkquest/daily-entry` (and `/daily-entry/:date` for editing). |
| 4 | **Stats** | Deeper analytics — weekly/monthly/yearly tabs. |
| 5 | **Goals** | Set daily/monthly word targets + tracking. |
| 6 | **Notes** | Free-form notes, separate from chapter notes. |
| 7 | **Settings** | Module-level prefs. |

Cut: **Calendar** (heatmap covers the use case).

## 5. Things to confirm with the user before writing code

These are the scoping questions Opus would ask first; ask them once when
resuming so you don't get walked back two messages later:

1. Which page(s) to build this round? (Recommend pairing **Projects +
   Project Detail** as a unit since they're tightly linked.)
2. Should **Daily Entry** as a full page replace the existing dialog, or
   coexist? (User has not decided yet — ask.)
3. Settings/Goals/Notes — do they actually need real persistence, or are
   they OK as static UI for now?

## 6. Quirks / gotchas

- The original components folder was `src/app/conponents/` (typo). It has
  already been renamed to `components/` and all imports updated. Do not
  recreate the typo'd folder.
- The dashboard at `/sakai` (component `Dashboard`) imports
  `InkQuestWidgetComponent` from
  `../../components/app-inkquest-widget/inkquest-widget.component`. Don't
  change that import unless you also rename the file.
- `inkquest.service.ts` has been edited by the user/linter after Opus wrote
  it — keep the latest contents on disk; don't overwrite.
- Two SCSS files (`inkquest-rings.component.scss` and the widget's
  `.scss`) were post-edited by the user with `:host ::ng-deep` rules and
  fixed-px ring sizes. Leave those alone unless asked.
- Class name **`InkQuestWidgetComponent`** (note CamelCase `InkQuest`) is
  the dashboard widget. Page-level classes use **`Inkquest…Component`**
  (lowercase `q`) to keep them distinct. Match this when adding new
  classes: pages = `Inkquest`, the dashboard widget = `InkQuest`.

## 7. Quick-start command for the next session

> "Read `INKQUEST_PLAN.md` at the repo root. Then build the Projects list
> page (`/sakai/inkquest/projects`) and the Project Detail page
> (`/sakai/inkquest/projects/:id`) following the conventions in section 2.3.
> Use the existing `searchProjects()` / `getProject()` /
> `searchChapters(projectId)` / `saveChapter()` / `deleteChapter()` methods
> from `InkquestService`. Add menu items inside the existing **Ink Quest**
> sidebar group. Stop and confirm before adding routes that don't exist
> yet."
