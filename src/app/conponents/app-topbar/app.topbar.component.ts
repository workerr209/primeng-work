import {Component} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {StyleClassModule} from 'primeng/styleclass';
import {LayoutService} from '../../layout/service/layout.service';
import {UserMenuTopbar} from "../user-menu-topbar/user-menu-topbar.component";
import {BadgeModule} from 'primeng/badge';
import {OverlayBadgeModule} from "primeng/overlaybadge";
import {AppConfigurator} from "../../layout/component/app.configurator";
import {appProperties} from "../../../app.properties";
import {NotificationBellComponent} from "../app-notification-bell/app.notification.bell.component";
import {environment} from "../../../environments/environment";

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule,
        CommonModule,
        StyleClassModule,
        UserMenuTopbar,
        BadgeModule,
        OverlayBadgeModule,
        AppConfigurator,
        NotificationBellComponent],
    templateUrl: `./app-topbar.component.html`
})
export class AppTopbar {
    protected readonly appProperties = appProperties;
    items!: MenuItem[];

    constructor(public layoutService: LayoutService,
                public router: Router) {
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({...state, darkTheme: !state.darkTheme}));
    }

    protected readonly environment = environment;
}
