import {Injectable, NgZone} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AuthService} from "./auth.service";
import {EventSourcePolyfill} from 'event-source-polyfill';
import {environment} from "../../environments/environment";

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private readonly API_URL = `${environment.BASE_API_URL}/api/v1/notifications`;
    private readonly MAX_RETRIES = 2;
    constructor(
        private http: HttpClient,
        private zone: NgZone,
        private authService: AuthService
    ) {}

    getNotificationStream(userId: string): Observable<any> {
        return new Observable(observer => {
            let eventSource: EventSourcePolyfill;
            let retryCount = 0;
            let retryTimer: ReturnType<typeof setTimeout> | undefined;

            const connect = () => {
                const token = this.authService.getAccessToken();
                if (!token) { return; }

                eventSource = new EventSourcePolyfill(
                    `${this.API_URL}/stream/${userId}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` },
                        heartbeatTimeout: 60000 // 60 วิ — server ส่ง keepalive comment ทุก ~45 วิ
                    }
                );

                eventSource.onmessage = (event: any) => {
                    retryCount = 0; // reset on successful message
                    this.zone.run(() => {
                        try { observer.next(JSON.parse(event.data)); }
                        catch { /* ignore malformed payload */ }
                    });
                };

                eventSource.onerror = (error: any) => {
                    eventSource.close();

                    if (error?.status === 401) {
                        // Token หมดอายุ — ลอง reconnect
                        if (retryCount < this.MAX_RETRIES) {
                            retryCount++;
                            console.warn(`SSE 401, reconnecting (${retryCount}/${this.MAX_RETRIES})...`);
                            retryTimer = setTimeout(() => connect(), 1000);
                        } else {
                            this.zone.run(() => {
                                this.authService.removeAccessToken();
                                observer.error('SSE auth failed after max retries.');
                            });
                        }
                        return;
                    }

                    // Heartbeat timeout หรือ network glitch — reconnect เงียบๆ ไม่ error observable
                    const isTimeout = !error?.status ||
                                      error?.error?.message?.includes('No activity');
                    if (isTimeout) {
                        console.warn('SSE timeout/glitch — reconnecting silently...');
                        retryTimer = setTimeout(() => connect(), 2000);
                        return;
                    }

                    // Server error จริง — backoff แล้วลองใหม่
                    if (retryCount < this.MAX_RETRIES) {
                        retryCount++;
                        const delay = retryCount * 3000;
                        console.warn(`SSE error, retry in ${delay}ms (${retryCount}/${this.MAX_RETRIES})...`);
                        retryTimer = setTimeout(() => connect(), delay);
                    } else {
                        this.zone.run(() => observer.error(error));
                    }
                };
            };

            connect();

            // Teardown: ปิด connection และยกเลิก retry timer
            return () => {
                clearTimeout(retryTimer);
                eventSource?.close();
            };
        });
    }

    getHistory(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/history/${userId}`);
    }

    getUnreadCount(userId: string): Observable<number> {
        return this.http.get<number>(`${this.API_URL}/unread-count/${userId}`);
    }

    markAllAsRead(userId: string): Observable<void> {
        return this.http.patch<void>(`${this.API_URL}/read-all/${userId}`, {});
    }

    markAsRead(id: string): Observable<void> {
        return this.http.patch<void>(`${this.API_URL}/read/${id}`, {});
    }

}
