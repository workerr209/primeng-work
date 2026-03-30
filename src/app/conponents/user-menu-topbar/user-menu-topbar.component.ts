import {Component, OnInit} from "@angular/core";
import {UserService} from "../../services/user.service";
import {User} from "../../models/user.model";
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";
import {Menu} from "primeng/menu";
import {MenuItem, PrimeTemplate} from "primeng/api";

@Component({
    selector: 'user-menu-topbar',
    standalone: true,
    imports: [
        Menu,
        PrimeTemplate
    ],
    templateUrl: './user-menu-topbar.component.html',
})
export class UserMenuTopbar implements OnInit {
    user: User | undefined;
    items: MenuItem[] | undefined;

    constructor(
        private router: Router,
        private userService: UserService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.user = this.userService.getUser();

        this.items = [
            {
                label: 'Profile',
                icon: 'pi pi-user',
                command: () => {
                    this.router.navigate(['/profile']).then(() => {
                        console.log('Navigation to Profile successful');
                    });
                }
            },
            {
                label: 'Settings',
                icon: 'pi pi-cog',
                command: () => {
                    this.router.navigate(['/settings']).then(() => {
                        console.log('Navigation to Settings successful');
                    });
                }
            },
            {
                separator: true
            },
            {
                label: 'Logout',
                icon: 'pi pi-sign-out',
                command: () => { this.ngLogoutClick(); }
            }
        ];
    }

    ngLogoutClick() {
        // เรียก AuthService เพื่อ Logout และ Redirect ไปหน้า Login
        this.authService.logout().subscribe(() => {
            this.router.navigate(['/']).then();
        });
    }
}