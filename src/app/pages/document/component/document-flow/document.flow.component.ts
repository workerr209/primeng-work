import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Step, StepList, Stepper} from "primeng/stepper";
import {Panel} from "primeng/panel";
import {Button} from "primeng/button";
import {DatePipe, DecimalPipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault} from "@angular/common";
import {appProperties} from "../../../../../app.properties";
import {Tooltip} from "primeng/tooltip";
import {FileUploadResult} from "../../../../components/files-upload/files-upload.component";
import {FilesUploadService} from "../../../../services/fileupload.service";
import {FileSaverService} from "ngx-filesaver";
import {MessageService} from "primeng/api";
import {ToastMessagesComponent} from "../../../../components/toast-messages/toast-messages.component";
import {YesNoPipe} from "../../../../pipes/yes-no.pipe";
import {DocumentService} from "../../../../services/document.service";
import {StepGroup} from "../../../../models/document.model";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";

@Component({
    selector: 'app-document-flow',
    imports: [
        Stepper,
        StepList,
        Step,
        Panel,
        Button,
        DatePipe,
        NgForOf,
        NgIf,
        Tooltip,
        ToastMessagesComponent,
        NgSwitch,
        NgSwitchCase,
        YesNoPipe,
        DecimalPipe,
        NgSwitchDefault,
        NgClass
    ],
    templateUrl: './document.flow.component.html',
    styleUrls: ['./document.flow.component.scss'],
    providers: [
        MessageService
    ],
})
export class DocumentFlowComponent implements OnInit {
    protected readonly appProperties = appProperties;
    isMobileCollapsed: boolean = false;
    loading: boolean = false;
    isAllowEdit:boolean = false;
    isActiveStep: boolean = false;
    stepActive: any;
    flowDoc: any;
    flowContent: any;
    flowContentKeys: any;
    flowContentDataType: Map<string, string> = new Map();
    documentForm: any;
    expandedSteps = new Set<number>();
    groupedStepsData: StepGroup[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private filesUploadService: FilesUploadService,
        private documentService: DocumentService,
        private fileSaver: FileSaverService,
        private breakpointObserver: BreakpointObserver,
        private readonly messageService: MessageService,
    ) {}

    fetchDocumentData(id:string) {
        this.loading = true;
        this.documentService.searchById(id).subscribe({
            next: (res) => {
                this.loading = false;
                this.documentForm = res;
                this.ngProcessDocumentData();
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: `Error ${err.status}`, detail: err.statusText });
            }
        });
    }
    ngOnInit() {
        this.breakpointObserver.observe([Breakpoints.Handset])
            .subscribe(result => {
                this.isMobileCollapsed = result.matches;
            });

        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.fetchDocumentData(id);
            } else {
                const stateId = history.state.id;
                const stateForm = history.state.documentForm;
                if (stateForm) {
                    this.documentForm = stateForm;
                    this.ngProcessDocumentData();
                }else if (stateId) {
                    this.fetchDocumentData(stateId);
                } else {
                    void this.router.navigate(['/document'], { relativeTo: this.route })
                }
            }
        });
    }

    ngProcessDocumentData() {
        if (!this.documentForm || !this.documentForm.flowDoc) {
            this.router.navigate(['/document'], { relativeTo: this.route }).then();
            return;
        }

        this.flowDoc = this.documentForm.flowDoc;
        this.isAllowEdit = this.documentForm.documentStatus === 0;
        this.stepActive = this.flowDoc.stepActive;
        this.isActiveStep = this.flowDoc.isActiveStep;

        // Build Data FlowContent Info
        this.flowContent = { ...this.documentForm };
        delete this.flowContent['id'];
        delete this.flowContent['tmpts'];
        delete this.flowContent['version'];
        delete this.flowContent['updateBy'];
        delete this.flowContent['updateDate'];
        delete this.flowContent['documentStatusSeverity'];
        if (this.flowContent.hasOwnProperty('documentStatusLabel')) {
            this.flowContent['documentStatus'] = this.flowContent['documentStatusLabel'];
            delete this.flowContent['documentStatusLabel'];
        }

        this.flowContentKeys =  Object.keys(this.flowContent);
        for (let fldKey of this.flowContentKeys) {
            const value = this.flowContent[fldKey];
            if (!value) {
                continue;
            }

            const dateType = typeof value;
            switch (dateType) {
                case 'number':
                    if (dateType === 'number' && value > 1000000000) {
                        this.flowContent[fldKey] = new Date(value);
                        this.flowContentDataType.set(fldKey, 'DATE');
                    } else {
                        this.flowContentDataType.set(fldKey, dateType.toUpperCase());
                    }
                    break;
                case 'object':
                    if (Array.isArray(value)) {
                        this.flowContentDataType.set(fldKey, 'LIST');
                        break;
                    }

                    if (value.hasOwnProperty('name')) {
                        this.flowContent[fldKey] = value.name;
                        this.flowContentDataType.set(fldKey, 'STRING');
                        break;
                    }

                    this.flowContentDataType.set(fldKey, dateType.toUpperCase());
                    break;
                default:
                    this.flowContentDataType.set(fldKey, dateType.toUpperCase());
            }
        }

        this.updateGroupedSteps();
        console.log('FlowDoc:', this.flowDoc);
    }

    updateGroupedSteps() {
        if (!this.flowDoc?.steps) {
            this.groupedStepsData = [];
            return;
        }

        const groups = this.flowDoc.steps.reduce((acc: Record<number, StepGroup>, curr: any) => {
            const key = curr.stepno;
            if (!acc[key]) {
                acc[key] = { stepno: key, actions: [] };
            }
            acc[key].actions.push(curr);
            return acc;
        }, {});

        this.groupedStepsData = (Object.values(groups) as StepGroup[]).sort((a, b) => a.stepno - b.stepno);
    }

    pageBack() {
        const backState = (this.isAllowEdit) ? 'document/form' : 'document';
        const fullPath = `/${appProperties.rootPath}/${backState}`;
        this.router.navigate([fullPath], {
            relativeTo: this.route,
            state: { documentForm: this.documentForm, }
        }).then(() => console.log('Navigated to:', fullPath));
    }

    ngSubmit() {
        this.documentService.submitFlow(this.documentForm).subscribe({
            next: (response) => {
                console.log('submit', response);
                this.documentForm = response;
                this.flowDoc = this.documentForm.flowDoc;
                this.isActiveStep = this.flowDoc.isActiveStep;
                this.isAllowEdit = this.documentForm.documentStatus === 0;
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'Submit Failed.'
                });
                console.error('Submit Error:', err);
            }
        });
    }

    downloadFile(file: FileUploadResult): void {
        this.filesUploadService.downloadFile(file.fileName).subscribe({
            next: (data: Blob) => {
                const label = file.fileLabel || file.fileName;
                this.fileSaver.save(data, label);
            },
            error: (err) => {
                this.showToast('error', 'Download failed');
                console.error(err);
            }
        });
    }

    resolveStepIcon(step: any): string {
        if (step.stepno === 0) {
            return 'pi pi-check';
        }

        if (step.actionDate) {
            return 'pi pi-check';
        }

        if (step.stepno === this.flowDoc?.activeStep) {
            return 'pi pi-hourglass';
        }

        return 'pi pi-lock text-400';
    }

    showToast(severity: string, detail: string) {
        this.messageService.add({ severity, summary: severity.toUpperCase(), detail, life: 5000 });
    }

    toggleStep(index: number) {
        console.log('toggle step', index);
        if (this.expandedSteps.has(index)) {
            this.expandedSteps.delete(index);
        } else {
            this.expandedSteps.add(index);
        }
    }

}