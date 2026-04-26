import { Component, forwardRef, OnInit } from "@angular/core";
import { Select } from "primeng/select";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";

interface DropdownOption {
    name: string;
    value: any;
}

@Component({
    selector: 'app-document-status-filter',
    standalone: true,
    template: `<p-select
            [options]="dropdownItems"
            [(ngModel)]="selectedValue"
            (onChange)="onSelectChange($event)"
            optionLabel="name"
            optionValue="value"
            placeholder="Select a Status"
            [fluid]="true">
    </p-select>`,
    imports: [
        Select,
        FormsModule
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DocumentStatusFilter),
            multi: true
        }
    ]
})
export class DocumentStatusFilter implements OnInit, ControlValueAccessor {
    dropdownItems: DropdownOption[] = [];
    selectedValue: any;

    // Functions สำหรับ ControlValueAccessor
    onChange: any = () => {};
    onTouched: any = () => {};

    constructor() {}

    ngOnInit(): void {
        this.dropdownItems = [
            { name: 'All', value: '-1' },
            { name: 'Drafts', value: '0' },
            { name: 'Waiting', value: '1' },
            { name: 'Approved', value: '2' },
            { name: 'Not Approved', value: '11' },
            { name: 'Cancel', value: '12' },
        ];
    }

    // เมื่อเลือกค่าจาก p-select
    onSelectChange(event: any) {
        this.onChange(event.value);
    }

    // มาตรฐาน ControlValueAccessor เพื่อให้รับค่าจาก formControlName
    writeValue(value: any): void {
        this.selectedValue = value;
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
}