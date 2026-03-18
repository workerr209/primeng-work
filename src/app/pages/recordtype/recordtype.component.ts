import {Component, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup} from "@angular/forms";
import {MessageService} from "primeng/api";
import {TableModule} from "primeng/table";
import {ActivatedRoute, Router} from "@angular/router";
import {appProperties} from "../../../app.properties";
import {RecordTypeService} from "../../services/recordtype.service";
import {RecordType} from "../../models/recordtype.model";

@Component({
    selector: 'app-recordtype',
    templateUrl: './recordtype.component.html',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        TableModule,
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
    item :RecordType | undefined;
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

    ngOnInit(): void {
        const recordTypeName = this.route.snapshot.paramMap.get('name') || 'AC_RecordType';
        console.log(`ngOnInit recordtype name : ${recordTypeName}`);

        // Fetch Data OF RecordType
        this.loading = true;
        this.recordtypeService.search(recordTypeName).subscribe({
            next: (res) => {
                this.loading = false;
                this.item = new RecordType(res);
                console.log('search result : ', this.item);

                const filterFields = this.item.filterFields || [];
                console.log('filterFields : ', filterFields);
            },
            error: (err) => {
                this.loading = false;
                console.error('search data failed', err);
                this.messageService.add({ severity: 'error', summary: `Error ${err.status}`, detail: err.statusText });
            }
        });
    }

    initForm() {
        const today : Date = new Date();
        /*this.searchForm.addControl("documentType", new UntypedFormControl('TIME', { nonNullable: true }));
        this.searchForm.addControl("documentStatus", new UntypedFormControl('-1', { nonNullable: true }));
        this.searchForm.addControl("emId", new UntypedFormControl(null));
        this.searchForm.addControl("month", new UntypedFormControl(today.getMonth()));
        this.searchForm.addControl("year", new UntypedFormControl(today.getFullYear()));*/
    }

}