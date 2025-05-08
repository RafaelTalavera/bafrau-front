// src/app/legal/service/control.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


import { environment } from '../../../environments/environment';
import { ControlDTO, ControlPayload } from '../models/control.model';

@Injectable({
  providedIn: 'root'
})
export class ControlService {
  private baseUrl = `${environment.apiUrl}/controles`;

  constructor(private http: HttpClient) {}

  /** POST /api/controles */
  createControl(payload: ControlPayload): Observable<ControlDTO> {
    console.log('▶️ JSON enviado a createControl:', JSON.stringify(payload, null, 2));
    return this.http.post<ControlDTO>(this.baseUrl, payload);
  }
  
  /** GET /api/controles */
  getControles(): Observable<ControlDTO[]> {
    return this.http.get<ControlDTO[]>(this.baseUrl);
  }

  /** GET /api/controles/:id */
  getControl(id: number): Observable<ControlDTO> {
    return this.http.get<ControlDTO>(`${this.baseUrl}/${id}`);
  }

  /** DELETE /api/controles/:id */
  deleteControl(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

    /** PUT /api/controles/:id */
    updateControl(id: number, payload: ControlPayload): Observable<ControlDTO> {
        return this.http.put<ControlDTO>(`${this.baseUrl}/${id}`, payload);
      }
    
}
