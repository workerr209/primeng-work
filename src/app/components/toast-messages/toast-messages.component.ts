import {Component, ViewEncapsulation} from '@angular/core';
import {Toast} from "primeng/toast";

@Component({
    selector: 'toast-messages',
    templateUrl: './toast-messages.component.html',
    styleUrls: ['./toast-messages.component.scss'],
    imports: [
        Toast
    ],
    encapsulation: ViewEncapsulation.None
})
export class ToastMessagesComponent {
    /*showInfoViaToast() {
        this.service.add({ severity: 'info', summary: 'Info Message', detail: 'PrimeNG rocks' });
    }

    showWarnViaToast() {
        this.service.add({ severity: 'warn', summary: 'Warn Message', detail: 'There are unsaved changes' });
    }

    showErrorViaToast() {
        this.service.add({ severity: 'error', summary: 'Error Message', detail: 'Validation failed' });
    }

    showSuccessViaToast() {
        this.service.add({ severity: 'success', summary: 'Success Message', detail: 'Message sent' });
    }*/
}
