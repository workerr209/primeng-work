import {Component, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {RippleModule} from 'primeng/ripple';
import {NgIf} from '@angular/common';
import {MessageService} from 'primeng/api';

import {AppFloatingConfigurator} from '../../../layout/component/app.floatingconfigurator';
import {ToastMessagesComponent} from '../../../components/toast-messages/toast-messages.component';
import {AuthService} from '../../../services/auth.service';
import {RegisterRequest} from "../../../models/registerRequest.model";
import {appProperties} from "../../../../app.properties";
import {environment} from "../../../../environments/environment";

@Component({
    selector: 'app-login',
    standalone: true,
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
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
export class RegisterComponent {
    readonly masterInputForm: FormGroup;
    protected readonly appProperties = appProperties;

    constructor(
        private readonly router: Router,
        private readonly authService: AuthService,
        private readonly messageService: MessageService,
        private readonly fb: FormBuilder
    ) {
        this.masterInputForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            fullName: ['', [Validators.required]],
        });
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

        const req: RegisterRequest = this.masterInputForm.getRawValue();
        this.authService.register(req).subscribe({
            next: data => {
                console.log('sign up success', data);
            },
            error: err => {
                let error : any = err.error || {};
                this.messageService.add({
                    severity: 'error',
                    summary: 'Register Failed.',
                    detail: error.message || '',
                });
            },
            complete: async () => {
                await this.router.navigate(['/login']);
            }
        });
    }

    async ngNavigateLogIn() {
        await this.router.navigate(['/login']);
    }

    protected readonly environment = environment;
}
