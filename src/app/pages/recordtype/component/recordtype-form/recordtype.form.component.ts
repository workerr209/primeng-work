import {Component, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup} from "@angular/forms";
import {Fluid} from "primeng/fluid";
import {RecordTypeService} from "../../../../services/recordtype.service";
import {ToastMessagesComponent} from "../../../../conponents/toast-messages/toast-messages.component";
import {MenuItem, MessageService} from "primeng/api";
import {TableModule} from "primeng/table";
import {ActivatedRoute, Router} from "@angular/router";
import {appProperties} from "../../../../../app.properties";
import {FormSection, RecordType, RecordTypeField, SectionData} from "../../../../models/recordtype.model";
import {firstValueFrom} from "rxjs";
import {DropdownModule} from "primeng/dropdown";
import {NgIf} from "@angular/common";
import {RecordListTableComponent} from "../recordlist-table/record-list-table.component";
import {DynamicInputComponent} from "../../../../conponents/dynamic-input-component/dynamic-input.component";

@Component({
    selector: 'app-recordtype-form',
    templateUrl: './recordtype.form.component.html',
    imports: [
        Button,
        FormsModule,
        Fluid,
        ReactiveFormsModule,
        ToastMessagesComponent,
        TableModule,
        DropdownModule,
        NgIf,
        RecordListTableComponent,
        DynamicInputComponent,
    ],
    providers: [RecordTypeService, MessageService]
})
export class RecordTypeFormComponent implements OnInit {
    protected readonly appProperties = appProperties;
    loading: boolean = false;
    isValidateFailed: boolean = false;
    items: MenuItem[] | undefined;
    home: MenuItem | undefined;
    requestForm!: UntypedFormGroup;
    recordTypeForm :RecordType | undefined;
    recordTypeItem :RecordType | undefined;
    listFormDisplay : RecordTypeField[] | undefined;
    groupedSectionFields : FormSection[] = [];
    groupedSectionFields1 : SectionData[] = [];
    groupedRowCntFields : Record<number, number> | undefined = {};
    cacheParentItem: Record<string, any> = {};

    constructor(
        private fb: UntypedFormBuilder,
        private readonly messageService: MessageService,
        private recordtypeService: RecordTypeService,
        private router: Router,
        private route: ActivatedRoute,
    ) {
        this.requestForm = fb.group({});
    }

    async ngOnInit(): Promise<void> {
        const formName: string = this.route.snapshot.paramMap.get('formName') || '';
        const itemId: string = this.route.snapshot.paramMap.get('itemId') || '';
        const itemName: string = this.route.snapshot.paramMap.get('itemName') || '';
        console.log(`ngOnInit recordtype name : ${formName} itemid : ${itemId} itemName : ${itemName}`);

        const state = history.state;
        this.recordTypeForm = state.recordTypeForm ? new RecordType(state.recordTypeForm) : undefined;
        this.recordTypeItem = state.recordTypeItem;
        this.cacheParentItem = { cacheRecordTypeForm : state.cacheRecordTypeForm
            , cacheRecordTypeResult : state.cacheRecordTypeResult
            , cacheRecordTypeSearchForm : state.cacheRecordTypeSearchForm
        };

        if (!this.recordTypeForm && formName) {
            console.log('Load recordTypeForm : ', formName);
            this.recordTypeForm = await this.fetchRecordTypeMetadata(formName);
        }

        if (!this.recordTypeItem) {
            console.log('Load recordTypeItem : ', itemId);
            this.recordTypeItem = await this.fetchRecordTypeItem(formName, itemId);
        }

        // Build Form Group
        const fldId = this.recordTypeForm?.fieldList.find(fld => fld.name === 'id');
        if (!fldId) {
            console.error('Field ID Not Found');
            this.messageService.add({
                severity: 'error',
                summary: 'Message',
                detail: 'Field ID Not Found'
            });
            return;
        }

        const auditFields = this.recordTypeForm?.auditFields || [];
        auditFields
            .filter((field): field is RecordTypeField & { name: string } => !!field.name)
            .forEach(field => {
                const fldName: string = field.name;
                const control = field.getFormGroupExistValue(this.recordTypeItem!);
                this.requestForm.addControl(fldName, control);
            });

        this.requestForm.addControl("id", fldId.getFormGroupExistValue(this.recordTypeItem!));
        this.listFormDisplay = this.recordTypeForm?.listFormDisplay || [];
        this.listFormDisplay
            .filter((field): field is RecordTypeField & { name: string } => !!field.name)
            .forEach(field => {
                const fldName: string = field.name;
                const control = field.getFormGroupExistValue(this.recordTypeItem!);
                this.requestForm.addControl(fldName, control);
            });
        this.groupedSectionFields = this.recordTypeForm?.groupedFields(this.listFormDisplay) || [];
        this.groupedSectionFields1 = this.recordTypeForm?.groupedSectionFields(this.listFormDisplay) || [];
        this.groupedRowCntFields = this.recordTypeForm?.groupedRowCntFields(this.listFormDisplay);
    }



    private async fetchRecordTypeMetadata(name: string): Promise<RecordType | undefined> {
        this.loading = true;
        try {
            const res = await firstValueFrom(this.recordtypeService.search(name));
            return new RecordType(res);
        } catch (err: any) {
            console.error('SCAI: Search metadata failed', err);
            this.messageService.add({
                severity: 'error',
                summary: `Error ${err.status || 'Unknown'}`,
                detail: err.statusText || 'Cannot connect to server'
            });
            return undefined;
        } finally {
            this.loading = false;
        }
    }

    private async fetchRecordTypeItem(name: string, id :string): Promise<RecordType | undefined> {
        this.loading = true;
        try {
            const res = await firstValueFrom(this.recordtypeService.getDataById(name, id));
            if (res && res.length > 0) {
                return new RecordType(res[0]);
            }
            return undefined;
        } catch (err: any) {
            console.error('Search metadata failed', err);
            this.messageService.add({
                severity: 'error',
                summary: `Error ${err.status || 'Unknown'}`,
                detail: err.statusText || 'Cannot connect to server'
            });
            return undefined;
        } finally {
            this.loading = false;
        }
    }

    async ngSave():Promise<void> {
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

        try {
            const payload = { ...requestForm.value };
            this.loading = true;
            requestForm.disable();

            const recordtype = this.recordTypeForm?.name || '';
            const response = await firstValueFrom(this.recordtypeService.save(recordtype, payload));
            console.log('submit', response);
            this.recordTypeItem = response.body;

            // clear state
            history.replaceState({}, '');

            // update cache data
            const cacheRecordTypeResult = this.cacheParentItem?.['cacheRecordTypeResult'] || {};
            const recordTypeName = this.recordTypeForm?.name || 'AC_RecordType'; // 'AC_RecordType'
            const list = cacheRecordTypeResult[recordTypeName] as any[];
            if (list && Array.isArray(list)) {
                const index = list.findIndex(item => String(item.id) === String(this.recordTypeItem?.id));
                if (index !== -1) {
                    list[index] = { ...this.recordTypeItem };
                    cacheRecordTypeResult[recordTypeName] = [...list];
                    console.log(`Updated ${recordTypeName} at index:`, index);
                } else {
                    list.unshift({ ...this.recordTypeItem });
                    cacheRecordTypeResult[recordTypeName] = [...list];
                    console.log(`Added new item to ${recordTypeName}`);
                }
            }

            // update ui
            requestForm.patchValue(this.recordTypeItem as any);
            requestForm.markAsPristine();
            requestForm.enable();

            this.loading = false;
            this.messageService.add({
                severity: 'success',
                summary: 'Message',
                detail: 'Success'
            });
        } catch (err : any) {
            requestForm.enable();
            this.loading = false;
            this.messageService.add({
                severity: 'error',
                summary: 'Message',
                detail: err.error?.message || 'Save Failed'
            });
            console.error(err);
        }
    }

    ngDelete():void {

    }

    pageBack() {
        this.ngOpenRecordTypeForm(this.recordTypeForm?.name || '', { cacheRecordTypeForm: this.cacheParentItem?.['cacheRecordTypeForm']
            , cacheRecordTypeResult: this.cacheParentItem?.['cacheRecordTypeResult']
            , cacheRecordTypeSearchForm : this.cacheParentItem?.['cacheRecordTypeSearchForm']
        })
    }

    ngOpenRecordTypeForm(recordTypeName : string, state :any):void {
        if (!recordTypeName) {
            console.warn('recordTypeForm.name is missing, fallback to relative navigation');
            void this.router.navigate(['../../'], { relativeTo: this.route });
            return;
        }

        const fullPath = `/${appProperties.rootPath}/recordtype/${recordTypeName}`;
        const navigationState = { state: state };
        console.log('navigating to:', fullPath, navigationState);
        void this.router.navigate([fullPath], navigationState);
    }

}