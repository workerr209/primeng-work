import {Component, OnInit} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators
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
import {ToastMessagesComponent} from "../../conponents/toast-messages/toast-messages.component";
import {DropdownModule} from "primeng/dropdown";
import {Tooltip} from "primeng/tooltip";
import {Panel} from "primeng/panel";
import {DynamicInputComponent} from "../../conponents/dynamic-input-component/dynamic-input.component";

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
        NgIf,
        ToastMessagesComponent,
        DropdownModule,
        Tooltip,
        Panel,
        DynamicInputComponent,
    ],
    styleUrls: ['./recordtype.component.scss'],
    providers: [RecordTypeService, MessageService]
})
export class RecordTypeComponent implements OnInit {
    searchForm!: UntypedFormGroup;
    toggleSearchForm: boolean = false;
    loading: boolean = false;
    isValidateFailed: boolean = false;
    displayConfirmation: boolean = false;
    messageConfirm: string = '';
    recordType :RecordType | undefined;
    recordTypeFilterField: RecordTypeField[] = [];
    recordTypeDisplayField: RecordTypeField[] = [];
    itemDelete :RecordType | undefined;
    resultItemList: RecordType[] = [];
    cacheSearchForm! : Record<string,any>;
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

        const state = history.state;
        if (state) {
            if (state.cacheRecordTypeForm?.[recordTypeName]) {
                this.recordType = new RecordType(state.cacheRecordTypeForm[recordTypeName]);
                console.log('Metadata loaded from Cache');
            }

            if (state.cacheRecordTypeResult?.[recordTypeName]) {
                this.resultItemList = state.cacheRecordTypeResult[recordTypeName];
                console.log('Result List loaded from Cache');
            }

            if (state.cacheRecordTypeSearchForm?.[recordTypeName]) {
                this.cacheSearchForm = state.cacheRecordTypeSearchForm[recordTypeName];
                console.log('Result List loaded from Cache');
            }
        }

        if (!this.recordType) {
            await this.fetchRecordTypeMetadata(recordTypeName);
        } else {
            this.prepareFieldsAndForm();
        }
    }

    async fetchRecordTypeMetadata(name: string) {
        this.loading = true;
        try {
            const res = await firstValueFrom(this.recordtypeService.search(name));
            this.recordType = new RecordType(res);
            console.log('fetchRecordTypeMetadata', this.recordType);
            this.prepareFieldsAndForm();
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

    prepareFieldsAndForm() {
        this.recordTypeFilterField = this.recordType?.filterFields || [];
        this.recordTypeDisplayField = this.recordType?.displayFields || [];
        this.buildSearchFormControl();
    }

    ngEditData(item : RecordType) {
        const recordTypeName = this.recordType?.name || '';
        const cacheRecordTypeForm = { [recordTypeName]: this.recordType };
        const cacheRecordTypeSearchForm = { [recordTypeName]: this.cacheSearchForm };
        const cacheRecordTypeResult = { [recordTypeName]: this.resultItemList };
        const fullPath = `/${appProperties.rootPath}/recordtype/form/${recordTypeName}/${item.name}/${item.id}`;
        console.log('ngEditData', fullPath);
        void this.router.navigate([fullPath], { state: { recordTypeForm: this.recordType
                , recordTypeItem: item
                , cacheRecordTypeForm : cacheRecordTypeForm
                , cacheRecordTypeResult : cacheRecordTypeResult
                , cacheRecordTypeSearchForm : cacheRecordTypeSearchForm
        } });
    }

    ngConfirmDelete(recordType : RecordType) {
        this.displayConfirmation = true
        this.itemDelete = recordType;
        this.messageConfirm = `Are you sure you want to proceed '${recordType.name}' ?`;
    }

    ngDeleteData() {
        this.displayConfirmation = false;

        if (!this.itemDelete || !this.itemDelete.id) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Document information is missing.'
            });
            return;
        }

        const id = this.itemDelete.id;
        console.log(id);
    }

    ngSearch() {
        const recordTypeName = this.recordType?.name || '';
        if (!recordTypeName) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error Message',
                detail: 'RecordType Not Found'
            });
            return;
        }

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

        this.cacheSearchForm = { ...searchForm.value };
        const criteria = this.recordtypeService.prepareSearchCriteria({ ...searchForm.value }, this.recordTypeFilterField);
        console.log('Search Criteria:', criteria);
        this.loading = true;
        this.recordtypeService.getData(recordTypeName, criteria).subscribe({
            next: (res) => {
                this.loading = false;
                this.resultItemList = res;
                console.log('search result : ', this.resultItemList);
                const isNotExistsValue = this.resultItemList.length === 0;
                this.toggleSearchForm = !isNotExistsValue;
                if (isNotExistsValue) {
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

    ngReload() {
        const recordTypeName = this.recordType?.name || '';
        if (!recordTypeName) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error Message',
                detail: 'RecordType Not Found'
            });
            return;
        }

        this.loading = true;
        this.recordtypeService.reload(recordTypeName).subscribe({
            next: async (res) => {
                history.replaceState({}, document.title);
                this.recordType = undefined;
                this.resultItemList = [];
                await this.ngOnInit();

                this.loading = false;
                console.log('reload result : ', res);
            },
            error: (err) => {
                this.loading = false;
                console.error('reload failed', err);
                this.messageService.add({ severity: 'error', summary: `Error ${err.status}`, detail: err.statusText });
            }
        });
    }

    buildSearchFormControl() {
        this.recordTypeFilterField
            .filter((field): field is RecordTypeField & { name: string } => !!field.name)
            .forEach(field => {
                const fldName = field.name;
                const required = field.isRequired;
                const defaultValue = (this.cacheSearchForm as any)?.[fldName] || this.resolveDefaultValue(field);
                const validators = required ? [Validators.required] : [];
                /*console.log('addControl', {
                    fldName: fldName,
                    rawVal: field.filterVal,
                    resolvedVal: defaultValue
                });*/

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