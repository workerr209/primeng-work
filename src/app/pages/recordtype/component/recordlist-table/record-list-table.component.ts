import {
    ChangeDetectorRef,
    Component,
    forwardRef,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild
} from "@angular/core";
import {
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    UntypedFormArray,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup
} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {firstValueFrom} from "rxjs";

import {Table, TableModule} from "primeng/table";
import {ButtonModule} from "primeng/button";
import {InputNumberModule} from "primeng/inputnumber";
import {InputTextModule} from "primeng/inputtext";
import {DatePickerModule} from "primeng/datepicker";

import {RecordTypeService} from "../../../../services/recordtype.service";
import {MessageService} from "primeng/api";
import {RecordType, RecordTypeField} from "../../../../models/recordtype.model";
import {BaseControlValueAccessor} from "../../../../models/base-control-value-accessor";
import {DropdownModule} from "primeng/dropdown";
import {appProperties} from "../../../../../app.properties";
import {DynamicInputComponent} from "../../../../conponents/dynamic-input-component/dynamic-input.component";

@Component({
    selector: 'app-record-list-table',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputNumberModule,
        InputTextModule,
        DatePickerModule,
        DropdownModule,
        DynamicInputComponent
    ],
    templateUrl: './record-list-table.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RecordListTableComponent),
            multi: true
        }
    ]
})
export class RecordListTableComponent extends BaseControlValueAccessor<Array<any>> implements OnInit, OnDestroy, OnChanges {
    @Input() relateRecordTypeName!: string;
    @ViewChild('dt') table!: Table;
    @Input() isValidateFailed: boolean | undefined;

    loading: boolean = false;
    isReady: boolean = false;
    listFormDisplay: RecordTypeField[] = [];
    tableForm!: UntypedFormGroup;

    private pendingData: any[] | null = null;

    override onChange = (newVal: any) => {
        console.log('onChange', newVal);
    };
    override onTouched = () => {
    };

    constructor(
        private fb: UntypedFormBuilder,
        private messageService: MessageService,
        private recordtypeService: RecordTypeService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
    }

    async ngOnInit(): Promise<void> {
        await this.loadMetadata();
        this.isReady = true;
        this.tableForm = this.fb.group({records: new UntypedFormArray([])});
        if (this.pendingData) {
            this.patchDataToForm(this.pendingData);
            this.pendingData = null;
        }

        this.tableForm.get('records')?.valueChanges.subscribe(val => {
            if (this.tableForm.dirty && this.onChange) {
                this.onChange(val);
            }
        });

        this.cdr.markForCheck();
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('ngOnChanges', changes);
    }

    ngOnDestroy(): void {
        console.log('ngOnDestroy');
    }

    get recordsForm(): UntypedFormArray {
        return this.tableForm?.get('records') as UntypedFormArray;
    }

    private async loadMetadata() {
        this.loading = true;
        try {
            const res = await firstValueFrom(this.recordtypeService.search(this.relateRecordTypeName));
            const recordType = new RecordType(res);
            this.listFormDisplay = recordType?.displayFields || [];
        } catch (err: any) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load metadata' });
        } finally {
            this.loading = false;
        }
    }

    override writeValue(value: any[]): void {
        if (!value) value = [];

        if (!this.isReady) {
            this.pendingData = value;
        } else {
            this.patchDataToForm(value);
        }
    }

    override registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    override registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    override setDisabledState?(isDisabled: boolean): void {
        isDisabled ? this.tableForm?.disable() : this.tableForm?.enable();
    }

    private patchDataToForm(dataList: any[]) {
        // ใช้เครื่องมือของ FormArray โดยตรงเพื่อไม่ให้เกิด Side effect
        const formArray = this.recordsForm;
        formArray.clear({ emitEvent: false });

        dataList.forEach(data => {
            const formGroup = this.fb.group({});
            const date = new Date();
            const time = date.getTime();
            formGroup.addControl('tmpts', new UntypedFormControl(time));

            this.listFormDisplay.forEach(field => {
                const control = field.getFormGroupExistValue(data);
                formGroup.addControl(field.name!, control);
            });

            // push แบบเงียบๆ
            formArray.push(formGroup, { emitEvent: false });
        });

        this.cdr.markForCheck();
    }

    protected readonly appProperties = appProperties;
}