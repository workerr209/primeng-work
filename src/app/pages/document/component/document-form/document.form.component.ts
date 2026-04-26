import {Component, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators
} from "@angular/forms";
import {Fluid} from "primeng/fluid";
import {DocumentService} from "../../../../services/document.service";
import {ToastMessagesComponent} from "../../../../components/toast-messages/toast-messages.component";
import {MenuItem, MessageService} from "primeng/api";
import {TableModule} from "primeng/table";
import {NgIf} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {DatePicker} from "primeng/datepicker";
import {LookupAutocompleteComponent} from "../../../../components/lookup-autocomplete/lookup-autocomplete.component";
import {Textarea} from "primeng/textarea";
import {appProperties} from "../../../../../app.properties";
import {FilesUploadComponent} from "../../../../components/files-upload/files-upload.component";

@Component({
    selector: 'app-document-form',
    templateUrl: './document.form.component.html',
    imports: [
        Button,
        FormsModule,
        Fluid,
        ReactiveFormsModule,
        ToastMessagesComponent,
        TableModule,
        DatePicker,
        LookupAutocompleteComponent,
        Textarea,
        NgIf,
        FilesUploadComponent,
    ],
    styleUrls: ['../../document.component.scss'],
    providers: [DocumentService, MessageService]
})
export class DocumentFormComponent implements OnInit {
    loading: boolean = false;
    isValidateFailed: boolean = false;
    items: MenuItem[] | undefined;
    home: MenuItem | undefined;
    requestForm!: UntypedFormGroup;
    documentForm: any;

    constructor(
        fb: UntypedFormBuilder,
        private readonly messageService: MessageService,
        private documentService: DocumentService,
        private router: Router,
        private route: ActivatedRoute,
    ) {
        this.requestForm = fb.group({});
    }

    ngOnInit(): void {
        const state = history.state;
        this.documentForm = state.documentForm;

        const today = new Date();
        this.requestForm = new UntypedFormGroup({
            emId: new UntypedFormControl(null, Validators.required),
            dateWork: new UntypedFormControl(today, Validators.required),
            dateTo: new UntypedFormControl(today),
            punI_D: new UntypedFormControl(today),
            punI_T: new UntypedFormControl(today),
            punO_D: new UntypedFormControl(today),
            punO_T: new UntypedFormControl(today),
            reasonId: new UntypedFormControl(null, Validators.required),
            remark: new UntypedFormControl(null),
            attachment: new UntypedFormControl(null)
        });

        if (this.documentForm) {
            this.requestForm.patchValue({
                ...this.documentForm,
                dateWork: new Date(this.documentForm.dateWork),
                dateTo: new Date(this.documentForm.dateTo),
                punI_D: new Date(this.documentForm.punI_D),
                punI_T: new Date(this.documentForm.punI_T),
                punO_D: new Date(this.documentForm.punO_D),
                punO_T: new Date(this.documentForm.punO_T),
            });
        }
    }

    /*private buildBreadcrumb() {
        let route = this.route.root;
        const breadcrumbs: MenuItem[] = [];
        let url = '';
        while (route.firstChild) {
            route = route.firstChild;
            const routeURL = route.snapshot.url
                .map(segment => segment.path)
                .join('/');
            if (routeURL) {
                url += `/${routeURL}`;
            }

            if (route.snapshot.data['breadcrumb']) {
                breadcrumbs.push({
                    label: route.snapshot.data['breadcrumb'],
                    routerLink: url
                });
            }
        }
        this.items = breadcrumbs;
    }*/

    ngDrafts() {
        const requestForm: UntypedFormGroup = this.requestForm;
        this.isValidateFailed = requestForm.invalid;

        if (this.isValidateFailed) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Required Information'
            });
            return;
        }

        const payload = { ...requestForm.value };
        payload.documentStatus = 0;
        payload.documentType = 'TIME';
        this.loading = true;
        requestForm.disable();

        this.documentService.save(payload).subscribe({
            next: (response) => {
                console.log('submit', response);
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Document Action Success'
                });
            },
            error: (err) => {
                this.loading = false;
                requestForm.enable();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'ไม่สามารถบันทึกข้อมูลได้'
                });
                console.error('Submit Error:', err);
            }
        });
    }

    ngGenerateFlow() {
        const requestForm: UntypedFormGroup = this.requestForm;
        this.isValidateFailed = requestForm.invalid;

        if (this.isValidateFailed) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Required Information'
            });
            return;
        }

        const payload = { ...requestForm.value };
        payload.documentType = 'TIME';
        this.loading = true;
        requestForm.disable();

        this.documentService.generateFlow(payload).subscribe({
            next: (response) => {
                console.log('submit', response);
                this.loading = false;

                this.router.navigate(['../flow'], {
                    relativeTo: this.route,
                    state: { documentForm: response, }
                }).then(() => console.log('open flow document'));

                /*this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Generate Flow Success'
                });*/

                // สามารถจัดการต่อได้ เช่น reset form หรือไปหน้าอื่น
                // this.resetForm();
            },
            error: (err) => {
                // เกิดข้อผิดพลาด
                this.loading = false;
                requestForm.enable(); // เปิดให้แก้ไขได้ใหม่
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'ไม่สามารถบันทึกข้อมูลได้'
                });
                console.error('Submit Error:', err);
            }
        });
    }

    pageBack() {
        this.router.navigate(['../'], {relativeTo: this.route}).then(() => console.log('open document page'));
    }

    protected readonly appProperties = appProperties;
}