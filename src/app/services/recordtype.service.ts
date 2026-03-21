import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {appProperties} from "../../app.properties";
import {DocumentCriteria, DocumentData} from "../models/document.model";
import {environment} from "../../environments/environment";
import {map} from "rxjs/operators";
import {RecordTypeField} from "../models/recordtype.model";

@Injectable({
    providedIn: 'root',
})
export class RecordTypeService {
    private readonly API_URL = `${environment.BASE_API_URL}/api/v1/recordtype`;
    constructor(private http: HttpClient) {
    }

    search(recordtypeName:string): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/search/${recordtypeName}`);
    }

    reload(recordtypeName:string): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/reload/${recordtypeName}`);
    }

    getData(recordtypeName: string, data: any): Observable<any> {
        const params = new HttpParams({ fromObject: data });
        const httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'}), params };
        return this.http.get<any>(`${this.API_URL}/data/search/${recordtypeName}`, httpOptions);
    }

    searchById(id : String): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/search/${id}`);
    }

    delete(id : String): Observable<any> {
        return this.http.delete(`${this.API_URL}/delete/${id}`);
    }

    save(payload: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/save`, payload);
    }

    generateFlow(payload: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/generate-flow`, payload);
    }

    submitFlow(payload: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/submit-flow`, payload);
    }

    prepareSearchCriteria(formValue: any, filterConfigs: RecordTypeField[]): Record<string, any> {
        const data: Record<string, any> = {};
        Object.keys(formValue).forEach(key => {
            const value = formValue[key];
            const config = filterConfigs.find(fld => fld.name! === key);
            if (value === null || value === undefined || value === '' || !config?.filterKey) {
                return;
            }

            const targetKey = config.filterKey;
            if (Array.isArray(value)) {
                data[targetKey] = value;
            } else if (this.isObjectWithId(value)) {
                // ถ้าเป็น Object ที่มี id (เช่น PrimeNG Dropdown/Lookup) ให้เอาแค่ ID
                data[targetKey] = value.id;
            }else if (value instanceof Date) {
                if (!isNaN(value.getTime())) {
                    data[targetKey] = value.toISOString();
                }
            } else {
                // ค่าทั่วไป (String, Number, Boolean)
                data[targetKey] = value;
            }
        });

        return data;
    }

    isObjectWithId(val: any): val is { id: any } {
        return val !== null && typeof val === 'object' && !Array.isArray(val) && 'id' in val;
    }

}
