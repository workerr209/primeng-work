import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {RippleModule} from 'primeng/ripple';
import {NgIf} from '@angular/common';
import {MessageService} from 'primeng/api';
import {of, switchMap} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {AppFloatingConfigurator} from '../../../layout/component/app.floatingconfigurator';
import {ToastMessagesComponent} from '../../../components/toast-messages/toast-messages.component';
import {AuthService} from '../../../services/auth.service';
import {UserService} from '../../../services/user.service';
import {LoginRequest} from '../../../models/loginRequest.model';
import {appProperties} from "../../../../app.properties";
import {environment} from "../../../../environments/environment";

@Component({
    selector: 'app-login',
    standalone: true,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        RippleModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        NgIf,
        AppFloatingConfigurator,
        ToastMessagesComponent
    ],
    providers: [MessageService],
    encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {
    readonly masterInputForm: FormGroup;
    protected readonly appProperties = appProperties;

    constructor(
        private readonly router: Router,
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly messageService: MessageService,
        private readonly fb: FormBuilder
    ) {
        this.masterInputForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
        const token = this.authService.getAccessToken(); // หรือชื่อที่คุณเก็บ token
        if (token) {
            // redirect ไปหน้า home
            this.router.navigate([`/${appProperties.rootPath}`]).then().catch((err) =>  console.error('Navigation error:', err));
        }
    }

    ngSubmitForm(): void {
        if (this.masterInputForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Error Message',
                detail: 'Validation failed'
            });
            return;
        }

        const req: LoginRequest = this.masterInputForm.getRawValue();
        this.authService.login(req).pipe(
            switchMap(() => this.userService.fetchUser()),
            catchError(err => {
                console.error('Login or fetchUser failed:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail: 'Username Or Password Invalid!'
                });
                return of(null);
            })
        ).subscribe(async (userData: any) => {
            if (userData) {
                this.userService.setUser(userData);
                await this.router.navigate([`/${appProperties.rootPath}`]);
            }
        });
    }

    async ngSignUpClick() {
        await this.router.navigate(['/auth/register']);
    }

    protected readonly environment = environment;
}
