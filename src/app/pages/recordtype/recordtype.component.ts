import {Component, OnInit} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup, Validators
} from "@angular/forms";
import {MessageService} from "primeng/api";
import {TableModule} from "primeng/table";
import {ActivatedRoute, Router} from "@angular/router";
import {appProperties} from "../../../app.properties";
import {RecordTypeService} from "../../services/recordtype.service";
import {RecordType, RecordTypeField} from "../../models/recordtype.model";
import {firstValueFrom} from "rxjs";
import {Button} from "primeng/button";
import {ConfirmationModalComponent} from "../../conponents/app-confirmation-modal/app.confirmation.modal.component";
import {NgIf} from "@angular/common";
import {Fluid} from "primeng/fluid";
import {LookupAutocompleteComponent} from "../../conponents/lookup-autocomplete/lookup-autocomplete.component";
import {ToastMessagesComponent} from "../../conponents/toast-messages/toast-messages.component";
import {InputText} from "primeng/inputtext";
import {Checkbox} from "primeng/checkbox";
import {DropdownModule} from "primeng/dropdown";
import {MultiSelect} from "primeng/multiselect";
import {Calendar} from "primeng/calendar";
import {InputNumber} from "primeng/inputnumber";
import {Textarea} from "primeng/textarea";
import {Password} from "primeng/password";
import {Tooltip} from "primeng/tooltip";
import {DatePicker} from "primeng/datepicker";

@Component({
    selector: 'app-recordtype',
    templateUrl: './recordtype.component.html',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        Button,
        ConfirmationModalComponent,
        Fluid,
        LookupAutocompleteComponent,
        NgIf,
        ToastMessagesComponent,
        InputText,
        Checkbox,
        DropdownModule,
        MultiSelect,
        Calendar,
        InputNumber,
        Textarea,
        Password,
        Tooltip,
        DatePicker,
    ],
    styleUrls: ['./recordtype.component.scss'],
    providers: [RecordTypeService, MessageService]
})
export class RecordTypeComponent implements OnInit {
    searchForm!: UntypedFormGroup;
    loading: boolean = false;
    isValidateFailed: boolean = false;
    displayConfirmation: boolean = false;
    messageConfirm: string = '';
    recordType! :RecordType;
    recordTypeFilterField: RecordTypeField[] = [];
    recordTypeDisplayField: RecordTypeField[] = [];
    itemDelete :RecordType | undefined;
    itemList: RecordType[] = [];
    protected readonly appProperties = appProperties;

    constructor(
        fb: UntypedFormBuilder,
        private readonly messageService: MessageService,
        private recordtypeService: RecordTypeService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.searchForm = fb.group({});
    }

    async ngOnInit(): Promise<void> {
        const recordTypeName = this.route.snapshot.paramMap.get('name') || 'AC_RecordType';
        console.log(`ngOnInit recordtype name : ${recordTypeName}`);
        this.loading = true;

        try {
            const res = await firstValueFrom(this.recordtypeService.search(recordTypeName));
            this.recordType = new RecordType(res);

            this.recordTypeFilterField = this.recordType.filterFields || [];
            this.recordTypeDisplayField = this.recordType.displayFields || [];
            console.log('recordtypeService.search result : ', this.recordType);
            console.log('recordtype display field : ', this.recordTypeDisplayField.map(r => r.name));
            this.buildSearchFormControl();
        } catch (err: any) {
            console.error('search data failed', err);
            this.messageService.add({
                severity: 'error',
                summary: `Error ${err.status}`,
                detail: err.statusText
            });
        } finally {
            this.loading = false;
        }
    }

    ngConfirmDelete(recordType : RecordType) {
        this.displayConfirmation = true
        this.itemDelete = recordType;
        this.messageConfirm = `Are you sure you want to proceed '${recordType.name}' ?`;
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

        /*this.documentService.delete(id).subscribe({
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
        });*/
    }

    ngSearchItemById(id : string) {
        console.log('Search By Id:', id);
        this.loading = true;
        this.recordtypeService.searchById(id).subscribe({
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

    ngSearch() {
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

        const criteria = this.recordtypeService.prepareSearchCriteria({ ...searchForm.value }, this.recordTypeFilterField);
        console.log('Search Criteria:', criteria);
        this.loading = true;
        this.recordtypeService.getData(this.recordType.name, criteria).subscribe({
            next: (res) => {
                this.loading = false;
                this.itemList = res;
                console.log('search result : ', this.itemList);
                if (this.itemList.length === 0) {
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

    getDisplayValue(item: any, field: RecordTypeField): string {
        const fieldName = field.name || '';
        const dataType = field.dataType;

        if (dataType === 'RECORD' && field.relateRecordTypeName) {
            return item[`${fieldName}Name`] || item[`${fieldName}Code`] || item[fieldName] || '';
        }

        if ((dataType === 'SELECT' || dataType === 'SELECTINT') && field.optionsSelect) {
            const value = item[fieldName];
            const option = field.optionsSelect.find(opt => String(opt.value) === String(value));
            return option ? option.label : (value || '');
        }

        return item[fieldName] || '';
    }

    buildSearchFormControl() {
        this.recordTypeFilterField
            .filter((field): field is RecordTypeField & { name: string } => !!field.name)
            .forEach(field => {
                const fldName = field.name;
                const required = field.isRequired;
                const defaultValue = this.resolveDefaultValue(field);
                const validators = required ? [Validators.required] : [];
                console.log('addControl', {
                    fldName: fldName,
                    rawVal: field.filterVal,
                    resolvedVal: defaultValue
                });

                this.searchForm.addControl(
                    fldName,
                    new UntypedFormControl(defaultValue, {
                        validators: validators,
                        nonNullable: required
                    })
                );
            });
    }

    resolveDefaultValue(field: RecordTypeField): any {
        const val = field.filterVal;
        if (!val) return null;

        if (val.startsWith('=')) {
            const formula = val.substring(1);
            if (formula.includes('UC.systemDate')) {
                return new Date();
            }
        }

        if (field.dataType === 'CHECKBOX') {
            return (field.isRequired) ? 0 : -1;
        }

        if (['SELECT', 'SELECTINT'].includes(field.dataType!)) {
            if (field.isRequired && field.optionsSelect?.length) {
                return field.optionsSelect[0].value;
            }
            return field.dataType === 'SELECTINT' ? -1 : '';
        }

        return val;
    }

}