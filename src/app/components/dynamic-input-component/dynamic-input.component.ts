import {Component, EventEmitter, forwardRef, Input, Output} from "@angular/core";
import {ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {RecordTypeField} from "../../models/recordtype.model";
import {CheckboxModule} from 'primeng/checkbox';
import {MultiSelectModule} from 'primeng/multiselect';
import {DatePickerModule} from 'primeng/datepicker';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {SelectModule} from 'primeng/select';
import {LookupAutocompleteComponent} from '../lookup-autocomplete/lookup-autocomplete.component';
import {Textarea} from "primeng/textarea";

@Component({
    selector: 'app-dynamic-input',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CheckboxModule,
        MultiSelectModule,
        DatePickerModule,
        InputNumberModule,
        InputTextModule,
        PasswordModule,
        SelectModule,
        LookupAutocompleteComponent,
        Textarea,
    ],
    templateUrl: './dynamic-input.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DynamicInputComponent),
            multi: true
        }
    ]
})
export class DynamicInputComponent implements ControlValueAccessor {
    @Input() field!: RecordTypeField;
    @Input() appProperties: any;
    @Input() isValidateFailed: boolean = false;
    @Output() onFinish = new EventEmitter<void>();

    value: any;
    disabled = false;
    onChange: any = () => {
    };
    onTouched: any = () => {
    };

    writeValue(val: any): void {
        this.value = val;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(val: boolean): void {
        this.disabled = val;
    }

    closeCell() {
        this.onFinish.emit();
    }

    handleValueChange(val: any) {
        this.value = val;
        this.onChange(val);
    }

    handleTextareaEnter(event: any) {
        if (!event.shiftKey) {
            event.preventDefault();
            this.closeCell();
        }
    }
}