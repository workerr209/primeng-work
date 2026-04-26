import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-confirmation-modal',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    template: `
    <p-dialog 
        [header]="header" 
        [(visible)]="visible" 
        [style]="{ width: '350px' }" 
        [modal]="true"
        (onHide)="onReject.emit()">
        
        <div class="flex items-center justify-center">
            <i [class]="icon + ' mr-4'" style="font-size: 2rem"> </i>
            <span>{{ message }}</span>
        </div>

        <ng-template #footer>
            <p-button 
                label="No" 
                icon="pi pi-times" 
                (click)="close(false)" 
                text 
                severity="secondary" />
            <p-button 
                [label]="confirmLabel" 
                [icon]="confirmIcon" 
                (click)="close(true)"
                severity="danger"
                outlined 
                autofocus />
        </ng-template>
    </p-dialog>
  `
})
export class ConfirmationModalComponent {
    @Input() visible = false;
    @Input() header = 'Confirmation';
    @Input() message = 'Are you sure?';
    @Input() icon = 'pi pi-exclamation-triangle';
    @Input() confirmLabel = 'Yes';
    @Input() confirmIcon = 'pi pi-check';
    @Input() confirmSeverity = 'danger';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onConfirm = new EventEmitter<void>();
    @Output() onReject = new EventEmitter<void>();

    close(isConfirm: boolean) {
        this.visible = false;
        this.visibleChange.emit(false);

        if (isConfirm) {
            this.onConfirm.emit();
        } else {
            this.onReject.emit();
        }
    }
}