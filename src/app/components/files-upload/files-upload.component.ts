import {Component, forwardRef, Input, OnInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {CommonModule} from '@angular/common'; // สำคัญ: สำหรับ *ngFor และ *ngIf
import {MessageService} from 'primeng/api';
import {FileUpload, FileUploadModule} from 'primeng/fileupload'; // สำคัญ: สำหรับ p-fileupload
import {ToastModule} from 'primeng/toast';
import {FilesUploadService} from "../../services/fileupload.service";
import {FileSaverService} from 'ngx-filesaver';
import {ToastMessagesComponent} from "../toast-messages/toast-messages.component";
import {HttpEvent, HttpEventType} from "@angular/common/http";
import {Button} from "primeng/button";

export interface FileUploadResult {
    fileName: string;
    fileLabel: string;
    fileType: string;
    filePath: string;
}

@Component({
    selector: 'app-files-upload',
    standalone: true,
    imports: [
        CommonModule,
        FileUploadModule,
        ToastModule,
        ToastMessagesComponent,
        Button
    ],
    templateUrl: `./files-upload.component.html`,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FilesUploadComponent),
            multi: true
        },
        MessageService
    ]
})

export class FilesUploadComponent implements OnInit, ControlValueAccessor {
    @ViewChild('fileUploader') fileUploader!: FileUpload;
    @Input() MAX_SIZE = 2000000; // 2MB ตามที่แสดงใน UI
    uploadedFiles: FileUploadResult[] = [];
    disabled = false;

    constructor(
        private filesUploadService: FilesUploadService,
        private readonly messageService: MessageService,
        private fileSaver: FileSaverService,
    ) {}

    onChange: any = () => {};
    onTouched: any = () => {};

    ngOnInit(): void {
        if (!this.uploadedFiles) {
            this.uploadedFiles = [];
        }
    }

    // --- ControlValueAccessor Implementation ---
    writeValue(value: FileUploadResult[]): void {
        this.uploadedFiles = value || [];
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    setProgress(progress : number) {
        const uploading : boolean = (progress > 0 && progress < 100);
        this.disabled = uploading;
        this.fileUploader.uploading = uploading;
        this.fileUploader.progress = progress;
        console.log(`set progress : ${this.fileUploader.progress}`)
        this.fileUploader.cd.markForCheck();
    }

    // --- Upload Logic ---
    /*onUpload(event: any): void {
        const files: File[] = event.files;
        this.setProgress(1);

        files.forEach(file => {
            this.filesUploadService.uploadFile(file).subscribe({
                next: (data) => {
                    if (data.status === 200) {
                        const result: FileUploadResult = data.body;
                        this.uploadedFiles.unshift(result);
                        this.onChange(this.uploadedFiles);
                        this.setProgress(100);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: `Upload Success: ${file.name}`
                        });
                    }
                },
                error: (err) => {
                    console.error('upload failed', err);
                    this.showToast('error', 'Upload failed');
                },
                complete: () => {
                    this.setProgress(0);
                    this.resetFileUploader();
                    console.log(`Completed upload for file: ${file.name}`);
                }
            });
        });
    }*/
    // --- Upload Logic ---
    onUpload(event: any): void {
        const files: File[] = event.files;

        // เริ่มต้นที่ 1% เพื่อแสดงให้เห็นว่าระบบกำลังทำงาน
        this.setProgress(1);

        files.forEach(file => {
            this.filesUploadService.uploadFile(file).subscribe({
                next: (event: HttpEvent<any>) => {
                    console.log('type:', event.type, HttpEventType[event.type]);
                    switch (event.type) {

                        case HttpEventType.UploadProgress:
                            console.log(`event total : ${event.total}`);
                            console.log(`event loaded : ${event.loaded}`);
                            // 1. จังหวะที่กำลังส่งข้อมูล (Progress)
                            if (event.total) {
                                const progress = Math.round((100 * event.loaded) / event.total);
                                this.setProgress(progress);
                            }
                            break;

                        case HttpEventType.Response:
                            // 2. จังหวะที่อัปโหลดเสร็จและได้รับ Data กลับมา (Response)
                            if (event.status === 200) {
                                const result: FileUploadResult = event.body;

                                // อัปเดตรายการไฟล์ใน UI
                                this.uploadedFiles.unshift(result);
                                this.onChange(this.uploadedFiles);

                                // แสดงแจ้งเตือนสำเร็จ
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Success',
                                    detail: `Upload Success: ${file.name}`
                                });
                            }
                            break;
                    }
                },
                error: (err) => {
                    console.error('upload failed', err);
                    this.showToast('error', `Upload failed: ${file.name}`);
                    this.setProgress(0);
                },
                complete: () => {
                    // ให้แถบค้างที่ 100% สักครู่เพื่อให้ User เห็นความสำเร็จ
                    this.setProgress(100);

                    setTimeout(() => {
                        this.resetFileUploader();
                        this.setProgress(0); // รีเซ็ตกลับเป็น 0 เพื่อซ่อนแถบ
                        console.log(`Completed upload for file: ${file.name}`);
                    }, 1000);
                }
            });
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

    removeFile(index: number): void {
        this.uploadedFiles.splice(index, 1);
        this.uploadedFiles = [...this.uploadedFiles];
        this.onChange(this.uploadedFiles);
    }

    resetFileUploader() {
        // Reset the file upload component after successful upload
        if (this.fileUploader) {
            this.fileUploader.clear(); // Clears the component state
        }
    }

    private showToast(severity: string, detail: string) {
        this.messageService.add({ severity, summary: severity.toUpperCase(), detail, life: 5000 });
    }
}