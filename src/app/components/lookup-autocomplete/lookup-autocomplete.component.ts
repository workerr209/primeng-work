import {Component, EventEmitter, forwardRef, Input, OnInit, Output, ViewChild} from "@angular/core";
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from "@angular/forms";
import {AutoComplete} from "primeng/autocomplete";
import {LookupService} from "../../services/lookup.service";
import {LookupItem} from "../../models/lookup.model";
import {firstValueFrom} from "rxjs";

interface autoCompleteItem {
    label: string;
    value: string;
}

@Component({
    selector: 'app-lookup-autocomplete',
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LookupAutocompleteComponent),
            multi: true
        }
    ],
    styleUrls: ['./lookup-autocomplete.component.scss'],
    template: `
        <div class="flex flex-col gap-1 w-full">
            <p-autocomplete [(ngModel)]="selectedItem"
                            [disabled]="disabled"
                            [virtualScroll]="true"
                            [suggestions]="filteredItems"
                            [virtualScrollItemSize]="34"
                            (completeMethod)="filterItems($event)"
                            (onSelect)="onItemSelect($event)"
                            (onFocus)="showAllItems()"
                            (onClear)="onClear()"
                            (onBlur)="onTouched()"
                            [minLength]="0"
                            optionLabel="label"
                            [dropdown]="true"
                            dropdownIcon="pi pi-search"
                            appendTo="body"
                            [style]="{'width': '100%'}"
                            [showClear]="true"
                            [inputStyle]="{'width': '100%'}"
                            [inputStyleClass]="isValidateFailed ? 'ng-invalid ng-dirty' : ''"
                            [placeholder]="isLoading ? 'Loading...' : 'Search'">
            </p-autocomplete>
        </div>`,

    imports: [
        FormsModule,
        AutoComplete
    ]
})

export class LookupAutocompleteComponent implements ControlValueAccessor, OnInit {
    @Input() recordTypeName: string = '';
    @Input() isValidateFailed: boolean | undefined;
    @Output() onSelect = new EventEmitter<any>();
    @ViewChild(AutoComplete) autoComplete!: AutoComplete;

    sourceItems: LookupItem[] = [];
    filteredItems: autoCompleteItem[] = [];
    selectedItem: autoCompleteItem | undefined;
    disabled: boolean = false;
    isLoading: boolean = false;
    // private pendingValue: any;
    private isSelecting = false;

    onChange: any = () => {};
    onTouched: any = () => {};

    constructor(private lookupService: LookupService) {}

    ngOnInit(): void {
        console.log('LookupAutocompleteComponent ngOnInit', this.recordTypeName);
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    private async loadLookupData(): Promise<void> {
        if (!this.recordTypeName || this.isLoading) return;
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        try {
            this.isLoading = true;
            console.log('loadLookupData: Fetching lookup data for', this.recordTypeName);
            const resPromise = firstValueFrom(this.lookupService.fetchDataLookup(this.recordTypeName));
            const [res] = await Promise.all([
                resPromise,
                delay(700)
            ]);

            if (res) {
                this.sourceItems = res.map(item => ({
                    id: item.id,
                    code: item.code,
                    name: item.name,
                }));

                /*if (this.pendingValue) {
                    await this.writeValue(this.pendingValue);
                }*/
            }
        } catch (err) {
            console.error('loadLookupData: Error loading lookup data:', err);
        } finally {
            this.isLoading = false;
        }
    }

    async writeValue(val: any): Promise<void>  {
        if (!val) {
            this.selectedItem = undefined;
            // this.pendingValue = null;
            return;
        }

        if (this.sourceItems.length === 0) {
            // this.pendingValue = val;
            this.selectedItem = undefined;

            const responses = await firstValueFrom(this.lookupService.fetchDataLookup(this.recordTypeName));
            this.sourceItems = responses.map(item => ({
                id: item.id,
                code: item.code,
                name: item.name,
            }));
            // return;
        }

        const targetId: string = val.id ? val.id : val;
        const foundItem: LookupItem | undefined = this.sourceItems.find(i => String(i.id) === String(targetId));

        if (foundItem) {
            this.selectedItem = {
                label: `${foundItem.code} : ${foundItem.name}`,
                value: foundItem.id
            };
            // this.pendingValue = null;
        } else {
            this.selectedItem = undefined;
        }
    }

    async onItemSelect(event: any): Promise<void> {
        console.log('onItemSelect', event);
        this.isSelecting = true;
        const selected = event.value;
        const value : string = selected.value;
        await this.writeValue(value);

        const outValue = this.sourceItems.find(item => item.id === value);
        this.onChange(outValue);
        this.onSelect.emit(outValue);
        if (this.autoComplete) {
            this.autoComplete.hide();
        }
    }

    onClear() {
        this.isSelecting = false;
        this.selectedItem = undefined;
        this.onChange(null);
    }

    async showAllItems() {
        if (this.disabled || this.isLoading) {
            return;
        }

        if (this.sourceItems.length === 0) {
            await this.loadLookupData();
        }

        if (this.isSelecting) {
            this.isSelecting = false;
            return;
        }

        this.filteredItems = this.sourceItems.map(item => ({
            label: `${item.code} : ${item.name}`,
            value: item.id
        }));

        setTimeout(() => {
            if (this.autoComplete && !this.selectedItem && !this.isLoading) {
                console.log('autoComplete show')
                this.autoComplete.show();
            }
        }, 150);
    }

    async filterItems(event: any) {
        console.log('filterItems triggered', event.query);
        if (this.sourceItems.length === 0) {
            this.autoComplete.hide();
            await this.loadLookupData();
        }

        const query = (event.query || '').toLowerCase();
        if (!query) {
            this.filteredItems = [...this.sourceItems].map(item => ({
                label: `${item.code} : ${item.name}`,
                value: item.id
            }));
        } else {
            this.filteredItems = this.sourceItems.filter(item =>
                item.code.toLowerCase().includes(query) ||
                item.name.toLowerCase().includes(query)
            ).map(item => ({
                label: `${item.code} : ${item.name}`,
                value: item.id
            }));
        }
    }

    registerOnChange(fn: any): void { this.onChange = fn; }
    registerOnTouched(fn: any): void { this.onTouched = fn; }
}
