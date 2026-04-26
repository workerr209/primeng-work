import { Component, forwardRef, Input, OnInit } from "@angular/core";
import { Select } from "primeng/select";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";

interface DropdownOption {
    label: string;
    value: any;
}

@Component({
    selector: 'app-month-year-filter',
    standalone: true,
    template: `
        <p-select
            [options]="filterOptions"
            [(ngModel)]="selectedValue"
            (onChange)="onSelectChange($event)"
            optionLabel="label"
            optionValue="value"
            [placeholder]="type === 'month' ? 'Select Month' : 'Select Year'"
            [fluid]="true">
        </p-select>`,
    imports: [Select, FormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MonthYearFilterComponent),
            multi: true
        }
    ]
})
export class MonthYearFilterComponent implements OnInit, ControlValueAccessor {
    @Input() type: 'month' | 'year' = 'month';

    filterOptions: DropdownOption[] = [];
    selectedValue: any;

    onChange: any = () => {};
    onTouched: any = () => {};

    ngOnInit(): void {
        if (this.type === 'month') {
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            this.filterOptions = [
                { label: 'All', value: 0 },
                ...monthNames.map((name, index) => ({ label: name, value: index + 1 }))
            ];
        } else {
            const currentYear = new Date().getFullYear();
            for (let i = currentYear - 5; i <= currentYear + 5; i++) {
                this.filterOptions.push({ label: i.toString(), value: i });
            }
        }
    }

    onSelectChange(event: any) {
        this.onChange(event.value);
    }

    writeValue(value: any): void { this.selectedValue = value; }
    registerOnChange(fn: any): void { this.onChange = fn; }
    registerOnTouched(fn: any): void { this.onTouched = fn; }
}