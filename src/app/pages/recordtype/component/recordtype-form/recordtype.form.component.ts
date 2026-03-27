import {Component, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {
    FormsModule,
    ReactiveFormsModule, UntypedFormArray,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators
} from "@angular/forms";
import {Fluid} from "primeng/fluid";
import {RecordTypeService} from "../../../../services/recordtype.service";
import {ToastMessagesComponent} from "../../../../conponents/toast-messages/toast-messages.component";
import {MenuItem, MessageService} from "primeng/api";
import {TableModule} from "primeng/table";
import {ActivatedRoute, Router} from "@angular/router";
import {appProperties} from "../../../../../app.properties";
import {FormSection, RecordType, RecordTypeField, SectionData} from "../../../../models/recordtype.model";
import {firstValueFrom} from "rxjs";
import {Calendar} from "primeng/calendar";
import {Checkbox} from "primeng/checkbox";
import {DatePicker} from "primeng/datepicker";
import {DropdownModule} from "primeng/dropdown";
import {InputNumber} from "primeng/inputnumber";
import {InputText} from "primeng/inputtext";
import {LookupAutocompleteComponent} from "../../../../conponents/lookup-autocomplete/lookup-autocomplete.component";
import {MultiSelect} from "primeng/multiselect";
import {Password} from "primeng/password";
import {Textarea} from "primeng/textarea";
import {NgIf} from "@angular/common";
import {RecordListTableComponent} from "../recordlist-table/record-list-table.component";
import {Select} from "primeng/select";

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
        Calendar,
        Checkbox,
        DatePicker,
        DropdownModule,
        InputNumber,
        InputText,
        LookupAutocompleteComponent,
        MultiSelect,
        Password,
        Textarea,
        NgIf,
        RecordListTableComponent,
        Select,
    ],
    providers: [RecordTypeService, MessageService]
})
export class RecordTypeFormComponent implements OnInit {
    protected readonly appProperties = appProperties;
    loading: boolean = false;
    isValidateFailed: boolean = false;
    items: MenuItem[] | undefined;
    home: MenuItem | undefined;
    formGroup!: UntypedFormGroup;
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
        this.formGroup = fb.group({});
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
            this.recordTypeItem = await this.fetchRecordTypeItem(itemName, itemId);
        }

        // Build Form Group
        this.listFormDisplay = this.recordTypeForm?.listFormDisplay || [];
        this.listFormDisplay
            .filter((field): field is RecordTypeField & { name: string } => !!field.name)
            .forEach(field => {
                const fldName: string = field.name;
                const control = field.getFormGroupExistValue(this.recordTypeItem!);
                this.formGroup.addControl(fldName, control);
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
            return new RecordType(res);
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

    ngSave():void {
        const value = this.formGroup.value;
        console.log('ngSave', value);
    }

    pageBack() {
        const recordTypeName = this.recordTypeForm?.name;
        if (!recordTypeName) {
            console.warn('recordTypeForm.name is missing, fallback to relative navigation');
            void this.router.navigate(['../../'], { relativeTo: this.route });
            return;
        }

        const fullPath = `/${appProperties.rootPath}/recordtype/${recordTypeName}`;
        const navigationState = {
            state: { cacheRecordTypeForm: this.cacheParentItem?.['cacheRecordTypeForm']
                , cacheRecordTypeResult: this.cacheParentItem?.['cacheRecordTypeResult']
                , cacheRecordTypeSearchForm : this.cacheParentItem?.['cacheRecordTypeSearchForm']
            }
        };

        console.log('pageBack navigating to:', fullPath, navigationState);
        void this.router.navigate([fullPath], navigationState);
    }

}