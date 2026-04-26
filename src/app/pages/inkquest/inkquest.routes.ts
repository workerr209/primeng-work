import { Routes } from '@angular/router';
import { InkquestComponent } from './inkquest.component';

export default [
    {
        path: '',
        component: InkquestComponent,
        data: { breadcrumb: 'Ink Quest' }
    },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
