import {Routes} from '@angular/router';
import {AppLayout} from './app/layout/component/app.layout';
import {Dashboard} from './app/pages/dashboard/dashboard';
import {Documentation} from './app/pages/documentation/documentation';
import {Landing} from './app/pages/landing/landing';
import {Notfound} from './app/pages/notfound/notfound';
import {LoginComponent} from "./app/pages/auth/login/login.component";
import {UserProfileComponent} from "./app/pages/profile/user-profile.component";
import {appProperties} from "./app.properties";
import {RunPayrollComponent} from "./app/pages/runpayroll/run-payroll.component";
import {OrgChartComponent} from "./app/pages/orgchart/org-chart.component";

export const appRoutes: Routes = [
    {path: '', component: LoginComponent},
    {path: 'login', component: LoginComponent},
    {
        path: `${appProperties.rootPath}`,
        component: AppLayout,
        children: [
            {path: '', component: Dashboard},
            {path: 'profile', component: UserProfileComponent},
            {path: 'run-payroll', component: RunPayrollComponent},
            {path: 'orgchart', component: OrgChartComponent},
            {path: 'document',
                loadChildren: () => import('./app/pages/document/document.routes'),
                data: { breadcrumb: 'Documents' }
            },
            {path: 'recordtype',
                loadChildren: () => import('./app/pages/recordtype/recordtype.routes'),
                data: { breadcrumb: 'RecordType' }
            },
            {path: 'inkquest',
                loadChildren: () => import('./app/pages/inkquest/inkquest.routes'),
                data: { breadcrumb: 'Ink Quest' }
            },
            {path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes')},
            {path: 'documentation', component: Documentation},
            {path: 'pages', loadChildren: () => import('./app/pages/pages.routes')},
        ]
    },
    {path: 'layout', component: Landing},
    {path: 'notfound', component: Notfound},
    {path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes')},
    {path: '**', redirectTo: '/notfound'}
];
