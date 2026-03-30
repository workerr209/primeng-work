import {UntypedFormArray, UntypedFormBuilder, UntypedFormControl, Validators} from "@angular/forms";

export class FormSection {
    label!: string;
    fields!: RecordTypeField[];
}

export class  RowData {
    rowNumber!: string;
    cols!: RecordTypeField[];
}

export class  SectionData {
    label!: string;
    rows!: RowData[];
}

export class GenericPersistentObject {
    createdBy?: string;
    createdDate?: Date | string | number;
    updatedBy?: string;
    updatedDate?: Date | string | number;
    version?: Number | string | number;
}

export class RecordType extends GenericPersistentObject {
    id!: string;
    name!: string;
    label!: string;
    inactive: boolean = false;
    custom: boolean = false;
    schemaField: boolean = false;
    loadOnInit: boolean = false;
    fieldList: RecordTypeField[] = [];

    className?: string;
    customActions?: string;
    customFrom?: string;
    customGroup?: string;
    customOrder?: string;
    customQueryType?: string;
    customSelect?: string;
    customWhere?: string;
    description?: string;
    eacFilter?: string;
    entityType?: string;
    expDate?: Date | string | number;
    groupMenu?: string;
    groupMenuCode?: string;
    hbmFile?: string;
    helpText?: string;
    hint?: string;
    tableName?: string;
    indexField?: string;
    licType?: string;
    menuOrder?: number;
    namespace?: string;
    onAfterQuery?: string;
    onBeforeDelete?: string;
    onBeforeQuery?: string;
    onBeforeSave?: string;
    onAfterSave?: string;
    formDTOClass?: string;
    overrideRecordType?: string;
    overrideByRecordType?: string;
    patFilter?: string;
    patId?: string;
    prop?: any;
    refRecordType?: string;
    remarks?: string;
    reportFilename?: string;
    scripts?: string;
    scriptStat?: string;
    serviceClass?: string;
    tab?: string;
    unity?: string;
    valstr?: string;

    constructor(data?: Partial<RecordType>) {
        super();
        if (data) {
            Object.assign(this, data);
            if (data.fieldList) {
                this.fieldList = data.fieldList.map(f => new RecordTypeField(f));
            }
        }
    }

    get auditFields(): RecordTypeField[] {
        const fields: RecordTypeField[] = [];
        const auditConfig = [
            { name: 'createdBy', label: 'Created By', type: 'TEXT' },
            { name: 'createdDate', label: 'Created Date', type: 'DATE' },
            { name: 'updatedBy', label: 'Updated By', type: 'TEXT' },
            { name: 'updatedDate', label: 'Updated Date', type: 'DATE' },
            { name: 'version', label: 'Version', type: 'NUMBER' }
        ];

        auditConfig.forEach(config => {
            const field = new RecordTypeField();
            field.name = config.name;
            field.label = config.label;
            field.dataType = config.type;
            // ตั้งค่าเพิ่มเติมเพื่อให้ UI รู้ว่าเป็นฟิลด์อ่านอย่างเดียว
            field.isVisible = 1;

            fields.push(field);
        });

        return fields;
    }

    get filterFields(): RecordTypeField[] {
        return (this.fieldList || [])
            .filter(field => (field.filterKey))
            .sort((a, b) => (a.fieldSeq || 0) - (b.fieldSeq || 0));
    }

    get displayFields(): RecordTypeField[] {
        return (this.fieldList || [])
            .filter(field => (field.displaySeq))
            .sort((a, b) => (a.displaySeq || 0) - (b.displaySeq || 0));
    }

    get listFormDisplay(): RecordTypeField[] {
        const getSectionOrder = (sectionStr: string | null | undefined): number => {
            if (!sectionStr) return 0;
            const order = parseInt(sectionStr.split(';')[0], 10);
            return isNaN(order) ? 0 : order;
        };

        return (this.fieldList || [])
            .filter(field => field.displayCol && field.displayRow)
            .sort((a, b) => {
                // 1. เรียงตามเลขหน้าของ Section (เช่น '1', '2')
                const orderA = getSectionOrder(a.displaySection);
                const orderB = getSectionOrder(b.displaySection);

                if (orderA !== orderB) {
                    return orderA - orderB;
                }

                if ((a.displayRow || 0) !== (b.displayRow || 0)) {
                    return (a.displayRow || 0) - (b.displayRow || 0);
                }

                return (a.displayCol || 0) - (b.displayCol || 0);
            });
    }

    get recordListFormDisplay(): RecordTypeField[] {
        const getSectionOrder = (sectionStr: string | null | undefined): number => {
            if (!sectionStr) return 0;
            const order = parseInt(sectionStr.split(';')[0], 10);
            return isNaN(order) ? 0 : order;
        };

        return (this.fieldList || [])
            .filter(field => field.displayCol && field.displayRow)
            .sort((a, b) => {
                const orderA = getSectionOrder(a.displaySection);
                const orderB = getSectionOrder(b.displaySection);

                if (orderA !== orderB) {
                    return orderA - orderB;
                }

                if ((a.displayRow || 0) !== (b.displayRow || 0)) {
                    return (a.displayRow || 0) - (b.displayRow || 0);
                }

                return (a.displayCol || 0) - (b.displayCol || 0);
            });
    }

    groupedFields(sorted: RecordTypeField[]): FormSection[] {
        const sections: { [key: string]: RecordTypeField[] } = {};

        // 2. จัดกลุ่มตาม Section Name
        sorted.forEach(field => {
            const sectionLabel = field.displaySection?.split(';')[1] || '';
            if (!sections[sectionLabel]) {
                sections[sectionLabel] = [];
            }
            sections[sectionLabel].push(field);
        });

        return Object.keys(sections).map(label => ({
            label,
            fields: sections[label]
        }));
    }

    groupedSectionFields(sorted: RecordTypeField[]): SectionData[] {
        const sections: Record<string, Record<number, RecordTypeField[]>> = {};
        sorted.forEach(field => {
            const sectionLabel = field.displaySection?.split(';')[1] || 'General Information';
            const rowNum = field.displayRow || 0;

            if (!sections[sectionLabel]) sections[sectionLabel] = {};
            if (!sections[sectionLabel][rowNum]) sections[sectionLabel][rowNum] = [];

            sections[sectionLabel][rowNum].push(field);
        });

        return Object.keys(sections).map(sLabel => ({
            label: sLabel,
            rows: Object.keys(sections[sLabel]).map(rNum => ({
                rowNumber: rNum,
                // sort row column
                cols: sections[sLabel][+rNum].sort((a, b) => (a.displayCol || 0) - (b.displayCol || 0))
            })).sort((a, b) => (+a.rowNumber) - (+b.rowNumber))
        }));
    }

    groupedRowCntFields(sorted: RecordTypeField[]): Record<number, number> {
        const counts: Record<number, number> = {};
        sorted.forEach(f => {
            const row = f.displayRow || 0;
            counts[row] = (counts[row] || 0) + 1;
        });
        return counts;
    }
}

export class RecordTypeField extends GenericPersistentObject {
    id!: string;
    name?: string;
    label?: string;
    dataType?: string;
    advFilterEn?: boolean;
    isSearchRequired?: boolean;
    displaySeq?: number;

    // Fields อื่นๆ ที่คุณมีใน Entity
    defaultPattern?: string;
    defaultValue?: string;
    description?: string;
    displayCol?: number;
    displayRow?: number;
    displaySection?: string;
    fieldSeq?: number;
    fieldType?: number;
    filterField?: string;
    filterKey?: string;
    filterOp?: string;
    filterVal?: string;
    groupLevel?: number;
    helpText?: string;
    columnName?: string;
    hint?: string;
    isIndex?: boolean;
    indexValue?: string;
    isRequired?: boolean;
    schema?: string;
    isUnique?: boolean;
    isVisible?: number;
    numPrecision?: number;
    numScale?: number;
    onBlur?: string;
    onChange?: string;
    optionLabels?: string;
    optionValues?: string;
    optionMapLabel?: any;
    refRecordTypeFields?: string;
    relateRecordBack?: string;
    relateRecordTypeId?: string;
    relateRecordTypeName?: string;
    scriptStat?: string;
    scriptTable?: string;
    txtLength?: number;
    unity?: string;
    visibleLines?: number;
    visibleWidth?: number;

    constructor(data?: Partial<RecordTypeField>) {
        super();
        if (data) {
            Object.assign(this, data);
        }
    }

    get optionsSelect() {
        if (!this.optionMapLabel) return [];
        return Object.entries(this.optionMapLabel).map(([key, value]) => ({
            label: value,
            value: this.dataType === 'SELECTINT' ? parseInt(key, 10) : key,
        }));
    }

    getDisplayValue(item: any): string {
        debugger;
        const fieldName = this.name || '';
        const dataType = this.dataType;

        if (dataType === 'RECORD' && this.relateRecordTypeName) {
            return item[`${fieldName}Name`] || item[`${fieldName}Code`] || item[fieldName] || '';
        }

        if ((dataType === 'SELECT' || dataType === 'SELECTINT') && this.optionsSelect) {
            const value = item[fieldName];
            const option = this.optionsSelect.find(opt => String(opt.value) === String(value));
            return option ? option.label : (value || '');
        }

        return item[fieldName] || '';
    }

    getDisplayValueFormControl(control: any): string {
        const fieldName = this.name || '';
        const dataType = this.dataType;

        // 1. ดึงค่าออกมาจาก FormControl (เพราะ rowControl คือ AbstractControl)
        const value = control?.get ? control.get(fieldName)?.value : control[fieldName];

        if (value === null || value === undefined || value === '') return '-';

        // Case: RECORD (Lookup)
        if (dataType === 'RECORD' && this.relateRecordTypeName) {
            // สำหรับ RECORD มักจะเก็บเป็น Object {id, code, name}
            return value.name || value.code || value.id || value;
        }

        // Case: SELECT / SELECTINT
        if ((dataType === 'SELECT' || dataType === 'SELECTINT') && this.optionsSelect) {
            // ใช้ String() ครอบเพื่อป้องกัน Type Mismatch (1 === "1")
            const option = this.optionsSelect.find(opt => String(opt.value) === String(value));
            return option ? option.label : value;
        }

        // Case: DATE
        if (dataType === 'DATE' && value instanceof Date) {
            // คืนค่า format วันที่แบบง่ายๆ (หรือใช้ pipe ใน html แทนก็ได้)
            return value.toLocaleDateString();
        }

        return value;
    }

    getFormGroupExistValue(item: any): any {
        const fldName = this.name!;
        const isRequired = this.isRequired || false;
        const validators = isRequired ? [Validators.required] : [];

        if (!item) {
            return new UntypedFormControl(null, {
                validators: validators,
                nonNullable: isRequired
            });
        }

        const rawValue = item[fldName] || null;
        if (this.dataType === 'RECORDLIST') {
            return new UntypedFormControl(rawValue ? structuredClone(rawValue) : [],{
                validators,
                nonNullable: isRequired
            });
        }

        let finalValue = rawValue;
        if (this.dataType === 'RECORD' && rawValue) {
            finalValue = {
                id : rawValue,
                code : item[`${fldName}Code`] || item[`${fldName}Name`],
                name : item[`${fldName}Name`] || item[`${fldName}Code`],
            }
        }


        if (this.dataType === 'SELECTINT' && rawValue) {
            finalValue = (rawValue !== '')
                ? parseInt(String(rawValue), 10)
                : null;
        }

        if (this.dataType === 'DATE' && rawValue) {
            finalValue = new Date(rawValue);
        }

        return new UntypedFormControl(finalValue, {
            validators: validators,
            nonNullable: isRequired
        });
    }
}

