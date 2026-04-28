import { Routes } from '@angular/router';
import { InkquestComponent } from './inkquest.component';
import { InkquestProjectsComponent } from './projects/projects.component';
import { InkquestProjectDetailComponent } from './projects/project-detail/project-detail.component';
import { InkquestDailyEntryComponent } from './daily-entry/daily-entry.component';
import { InkquestStatsComponent } from './stats/stats.component';
import { InkquestGoalsComponent } from './goals/goals.component';
import { InkquestNotesComponent } from './notes/notes.component';
import { InkquestSettingsComponent } from './settings/settings.component';

export default [
    { path: '',                component: InkquestComponent,             data: { breadcrumb: 'Ink Quest' } },
    { path: 'projects',        component: InkquestProjectsComponent,     data: { breadcrumb: 'Projects' } },
    { path: 'projects/:id',    component: InkquestProjectDetailComponent, data: { breadcrumb: 'Project Detail' } },
    { path: 'daily-entry',     component: InkquestDailyEntryComponent,   data: { breadcrumb: 'Daily Entry' } },
    { path: 'daily-entry/:date', component: InkquestDailyEntryComponent, data: { breadcrumb: 'Edit Entry' } },
    { path: 'stats',           component: InkquestStatsComponent,        data: { breadcrumb: 'Stats' } },
    { path: 'goals',           component: InkquestGoalsComponent,        data: { breadcrumb: 'Goals' } },
    { path: 'notes',           component: InkquestNotesComponent,        data: { breadcrumb: 'Notes' } },
    { path: 'settings',        component: InkquestSettingsComponent,     data: { breadcrumb: 'Settings' } },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
