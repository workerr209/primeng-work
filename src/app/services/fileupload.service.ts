import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {appProperties} from "../../app.properties";
import {LookupResponse} from "../models/lookupResponse.model";
import {environment} from "../../environments/environment";

@Injectable({
    providedIn: 'root',
})
export class FilesUploadService {
    private readonly API_URL = `${environment.BASE_API_URL}/api/v1/files`;
    constructor(private http: HttpClient) {
    }

    /*uploadFile(file: File): Observable<any> {
        const formData: FormData = new FormData();
        formData.append('file', file, file.name);
        const httpOptions: Object = {
            headers: new HttpHeaders({
            }),
            observe: 'events' as const, // force type to constant For TS know that event stream
            reportProgress: true        // สำคัญมาก: เพื่อให้ส่งจังหวะการส่งข้อมูลออกมา
        };


        return this.http.post(`${this.API_URL}/upload`, formData, httpOptions);
    }*/

    uploadFile(file: File): Observable<HttpEvent<any>> {
        const formData: FormData = new FormData();
        formData.append('file', file, file.name);

        // สร้าง Request object โดยตรง
        const req = new HttpRequest('POST', `${this.API_URL}/upload`, formData, {
            reportProgress: true, // บังคับรายงานความคืบหน้า
            responseType: 'json'
        });

        // ส่ง request ผ่านเมธอด request() แทน post()
        return this.http.request(req);
    }


    downloadFile(filename: string): Observable<any> {
        const httpOptions: Object = {
            headers: new HttpHeaders({'Content-Type': 'application/json'}),
            responseType: 'blob' as 'json'
        };
        return this.http.get(`${this.API_URL}/download/${filename}`, httpOptions);
    }

    publicFileUrl(fileRef: string): string {
        if (!fileRef) return '';
        if (/^(https?:|data:|blob:|assets\/|\/)/.test(fileRef)) return fileRef;
        return `${this.API_URL}/public/${encodeURIComponent(fileRef)}`;
    }

    publicFileName(fileRef: string): string {
        if (!fileRef) return '';
        const marker = '/api/v1/files/public/';
        const markerIndex = fileRef.indexOf(marker);
        if (markerIndex >= 0) return decodeURIComponent(fileRef.slice(markerIndex + marker.length));

        const publicIndex = fileRef.indexOf('/public/');
        if (publicIndex >= 0) return decodeURIComponent(fileRef.slice(publicIndex + '/public/'.length));

        return fileRef;
    }

}
