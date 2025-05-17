import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RequestService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<any[]>(`${environment.apiUrl}/requests`);
    }

    getById(id: number) {
        return this.http.get<any>(`${environment.apiUrl}/requests/${id}`);
    }

    create(request) {
        return this.http.post(`${environment.apiUrl}/requests`, request);
    }

    update(id: number, request) {
        return this.http.put(`${environment.apiUrl}/requests/${id}`, request);
    }

    delete(id: number) {
        return this.http.delete(`${environment.apiUrl}/requests/${id}`);
    }
}