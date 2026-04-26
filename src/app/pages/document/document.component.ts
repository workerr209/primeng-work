import {Component, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup
} from "@angular/forms";
import {Fluid} from "primeng/fluid";
import {MonthYearFilterComponent} from "../../components/month-year-filter/month-year-filter.component";
import {LookupAutocompleteComponent} from "../../components/lookup-autocomplete/lookup-autocomplete.component";
import {DocumentStatusFilter} from "../../components/document-status-filter/document-status-filter";
import {DocumentData} from "../../models/document.model";
import {DocumentService} from "../../services/document.service";
import {ToastMessagesComponent} from "../../components/toast-messages/toast-messages.component";
import {MessageService} from "primeng/api";
import {TableModule} from "primeng/table";
import {DatePipe, NgIf} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {appProperties} from "../../../app.properties";
import {ConfirmationModalComponent} from "../../components/app-confirmation-modal/app.confirmation.modal.component";

@Component({
    selector: 'app-document',
    templateUrl: './document.component.html',
    imports: [
        Button,
        FormsModule,
        Fluid,
        MonthYearFilterComponent,
        LookupAutocompleteComponent,
        DocumentStatusFilter,
        ReactiveFormsModule,
        ToastMessagesComponent,
        TableModule,
        NgIf,
        DatePipe,
        ConfirmationModalComponent,


    ],
    styleUrls: ['./document.component.scss'],
    providers: [DocumentService, MessageService]
})
export class DocumentComponent implements OnInit {
    searchForm!: UntypedFormGroup;
    loading: boolean = false;
    isValidateFailed: boolean = false;
    displayConfirmation: boolean = false;
    messageConfirm: string = '';
    itemDelete :DocumentData | undefined;
    documentList: DocumentData[] = [];
    protected readonly appProperties = appProperties;

    constructor(
        fb: UntypedFormBuilder,
        private readonly messageService: MessageService,
        private documentService: DocumentService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.searchForm = fb.group({});
    }

    ngOnInit(): void {
        console.log('ngOnInit');
        this.initForm();
    }

    initForm() {
        const today : Date = new Date();
        this.searchForm.addControl("documentType", new UntypedFormControl('TIME', { nonNullable: true }));
        this.searchForm.addControl("documentStatus", new UntypedFormControl('-1', { nonNullable: true }));
        this.searchForm.addControl("emId", new UntypedFormControl(null));
        this.searchForm.addControl("month", new UntypedFormControl(today.getMonth()));
        this.searchForm.addControl("year", new UntypedFormControl(today.getFullYear()));
    }

    onCreate() {
        this.router.navigate(['form'], {relativeTo: this.route}).then(() => {});
    }

    onSearch() {
        const searchForm : UntypedFormGroup = this.searchForm;
        this.isValidateFailed = searchForm.invalid;
        if (this.isValidateFailed) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Validation failed'
            });
            return;
        }

        const criteria = { ...searchForm.value };
        const year = parseInt(criteria.year);
        const month = parseInt(criteria.month);
        criteria.dateVF = new Date(year, month, 1, 0, 0, 0);
        criteria.dateVT = new Date(year, month + 1, 0, 23, 59, 59);
        criteria.documentStatus = (criteria.documentStatus === '-1') ? null : criteria.documentStatus;

        console.log('Search Criteria:', criteria);
        this.loading = true;
        this.documentService.search(criteria).subscribe({
            next: (res) => {
                this.loading = false;
                this.documentList = res;
                console.log('search result : ', this.documentList);
                if (this.documentList.length === 0) {
                    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'No data found' });
                }
            },
            error: (err) => {
                this.loading = false;
                console.error('search data failed', err);
                this.messageService.add({ severity: 'error', summary: `Error ${err.status}`, detail: err.statusText });
            }
        });
    }

    ngDelete(doc : DocumentData) {
        this.displayConfirmation = true
        this.itemDelete = doc;
        this.messageConfirm = `Are you sure you want to proceed '${doc.documentNo}' ?`;
    }

    ngSearchItemById(id : string) {
        console.log('Search By Id:', id);
        this.loading = true;
        this.documentService.searchById(id).subscribe({
            next: (res) => {
                this.loading = false;
                const documentState = (res.hasOwnProperty('flowDoc')) ? 'flow' : 'form'
                this.router.navigate([`${documentState}/${res.id}`], {
                    relativeTo: this.route,
                    state: { documentForm: res, }
                }).then(() => console.log(`open ${documentState} document`));
                console.log('search result : ', res);
            },
            error: (err) => {
                this.loading = false;
                console.error('search data failed', err);
                this.messageService.add({ severity: 'error', summary: `Error ${err.status}`, detail: err.statusText });
            }
        });
    }

    ngDeleteData() {
        this.displayConfirmation = false;

        // 1. Check null/undefined ให้ชัวร์
        if (!this.itemDelete || !this.itemDelete.id) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Document information is missing.'
            });
            return;
        }

        const id = this.itemDelete.id;
        this.loading = true;

        this.documentService.delete(id).subscribe({
            next: (res) => {
                console.log('delete', res);
                this.loading = false;
                this.documentList = this.documentList.filter(doc => doc.id !== id);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Document deleted successfully'
                });

                this.itemDelete = undefined;
            },
            error: (err) => {
                this.loading = false;
                console.error('delete data failed', err);
                this.messageService.add({
                    severity: 'error',
                    summary: `Error ${err.status}`,
                    detail: err.message || err.statusText
                });
            }
        });
    }

}