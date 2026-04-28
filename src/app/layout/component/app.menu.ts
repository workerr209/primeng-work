import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {MenuItem} from 'primeng/api';
import {AppMenuitem} from './app.menuitem';
import {appProperties} from "../../../app.properties";

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <ul class="layout-menu">
            <ng-container *ngFor="let item of model; let i = index">
                <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];
    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    {label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/']},
                    {label: 'Profile', icon: 'pi pi-fw pi-user', routerLink: [`/${appProperties.rootPath}/profile`]},
                    {label: 'Document', icon: 'pi pi-fw pi-id-card', routerLink: [`/${appProperties.rootPath}/document`]},
                    {label: 'RecordType', icon: 'pi pi-fw pi-id-card', routerLink: [`/${appProperties.rootPath}/recordtype`]},
                    {label: 'OrgChart', icon: 'pi pi-fw pi-id-card', routerLink: [`/${appProperties.rootPath}/orgchart`]},
                    {label: 'Run Payroll', icon: 'pi pi-fw pi-id-card', routerLink: [`/${appProperties.rootPath}/run-payroll`]},
                ]
            },
            {
                label: 'Ink Quest',
                items: [
                    { label: 'Overview',     icon: 'pi pi-fw pi-pencil',       routerLink: [`/${appProperties.rootPath}/inkquest`] },
                    { label: 'Projects',     icon: 'pi pi-fw pi-book',          routerLink: [`/${appProperties.rootPath}/inkquest/projects`] },
                    { label: 'Daily Entry',  icon: 'pi pi-fw pi-calendar-plus', routerLink: [`/${appProperties.rootPath}/inkquest/daily-entry`] },
                    { label: 'Stats',        icon: 'pi pi-fw pi-chart-bar',     routerLink: [`/${appProperties.rootPath}/inkquest/stats`] },
                    { label: 'Goals',        icon: 'pi pi-fw pi-bullseye',        routerLink: [`/${appProperties.rootPath}/inkquest/goals`] },
                    { label: 'Notes',        icon: 'pi pi-fw pi-file-edit',     routerLink: [`/${appProperties.rootPath}/inkquest/notes`] },
                    { label: 'Settings',     icon: 'pi pi-fw pi-cog',           routerLink: [`/${appProperties.rootPath}/inkquest/settings`] },
                ]
            },
            {
                label: 'UI Components',
                items: [
                    {
                        label: 'Form Layout',
                        icon: 'pi pi-fw pi-id-card',
                        routerLink: [`/${appProperties.rootPath}/uikit/formlayout`]
                    },
                    {label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: [`/${appProperties.rootPath}/uikit/input`]},
                    {
                        label: 'Button',
                        icon: 'pi pi-fw pi-mobile',
                        class: 'rotated-icon',
                        routerLink: [`/${appProperties.rootPath}/uikit/button`]
                    },
                    {label: 'Table', icon: 'pi pi-fw pi-table', routerLink: [`/${appProperties.rootPath}/uikit/table`]},
                    {label: 'List', icon: 'pi pi-fw pi-list', routerLink: [`/${appProperties.rootPath}/uikit/list`]},
                    {label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: [`/${appProperties.rootPath}/uikit/tree`]},
                    {label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: [`/${appProperties.rootPath}/uikit/panel`]},
                    {label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: [`/${appProperties.rootPath}/uikit/overlay`]},
                    {label: 'Media', icon: 'pi pi-fw pi-image', routerLink: [`/${appProperties.rootPath}/uikit/media`]},
                    {label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: [`/${appProperties.rootPath}/uikit/menu`]},
                    {label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: [`/${appProperties.rootPath}/uikit/message`]},
                    {label: 'File', icon: 'pi pi-fw pi-file', routerLink: [`/${appProperties.rootPath}/uikit/file`]},
                    {label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: [`/${appProperties.rootPath}/uikit/charts`]},
                    {label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: [`/${appProperties.rootPath}/uikit/timeline`]},
                    {label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: [`/${appProperties.rootPath}/uikit/misc`]}
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/pages'],
                items: [
                    /*{
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/']
                    },*/
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'LoginComponent',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Error',
                                icon: 'pi pi-fw pi-times-circle',
                                routerLink: ['/auth/error']
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Crud',
                        icon: 'pi pi-fw pi-pencil',
                        routerLink: [`/${appProperties.rootPath}/pages/crud`]
                    },
                    {
                        label: 'Not Found',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: [`/${appProperties.rootPath}/pages/notfound`]
                    },
                    {
                        label: 'Profile',
                        icon: 'pi pi-fw pi-circle-off',
                        routerLink: [`/${appProperties.rootPath}/pages/empty`]
                    }
                ]
            },
            {
                label: 'Hierarchy',
                items: [
                    {
                        label: 'Submenu 1',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            {
                                label: 'Submenu 1.1',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    {label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark'},
                                    {label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark'},
                                    {label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark'}
                                ]
                            },
                            {
                                label: 'Submenu 1.2',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [{label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark'}]
                            }
                        ]
                    },
                    {
                        label: 'Submenu 2',
                        icon: 'pi pi-fw pi-bookmark',
                        items: [
                            {
                                label: 'Submenu 2.1',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [
                                    {label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark'},
                                    {label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark'}
                                ]
                            },
                            {
                                label: 'Submenu 2.2',
                                icon: 'pi pi-fw pi-bookmark',
                                items: [{label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark'}]
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation',
                        icon: 'pi pi-fw pi-book',
                        routerLink: [`/${appProperties.rootPath}/documentation`]
                    },
                    {
                        label: 'View Source',
                        icon: 'pi pi-fw pi-github',
                        url: 'https://github.com/primefaces/sakai-ng',
                        target: '_blank'
                    }
                ]
            }
        ];
    }
}
