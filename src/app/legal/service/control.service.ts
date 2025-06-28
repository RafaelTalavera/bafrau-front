// src/app/legal/service/control.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ControlDTO, ControlPayload, ItemControlDTO, OrganizacionDTO } from '../models/control.model';

@Injectable({
  providedIn: 'root'
})
export class ControlService {
  private baseUrl = `${environment.apiUrl}/controles`;

  constructor(private http: HttpClient) {}

  /** Agrega el JWT en el header */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    console.log(`token acá: ${token}`);
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** POST /api/controles */
  createControl(payload: ControlPayload): Observable<ControlDTO> {
    console.log('▶️ JSON enviado a createControl:', JSON.stringify(payload, null, 2));
    return this.http.post<ControlDTO>(
        this.baseUrl,
        payload,
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(res => console.log('✅ POST control:', res)),
        catchError(err => {
          console.error('❌ POST control error:', err);
          return throwError(() => err);
        })
      );
  }

  /** GET /api/controles */
  getControles(): Observable<ControlDTO[]> {
    return this.http.get<ControlDTO[]>(
        this.baseUrl,
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(list => console.log('✅ GET controles:', list)),
        catchError(err => {
          console.error('❌ GET controles error:', err);
          return throwError(() => err);
        })
      );
  }

  /** GET /api/controles/:id */
  getControl(id: number): Observable<ControlDTO> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<ControlDTO>(
        url,
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(res => console.log(`✅ GET control ${id}:`, res)),
        catchError(err => {
          console.error(`❌ GET control ${id} error:`, err);
          return throwError(() => err);
        })
      );
  }

  /** DELETE /api/controles/:id */
  deleteControl(id: number): Observable<void> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<void>(
        url,
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(() => console.log(`✅ DELETE control ${id}`)),
        catchError(err => {
          console.error(`❌ DELETE control ${id} error:`, err);
          return throwError(() => err);
        })
      );
  }

  /** PUT /api/controles/:id */
  updateControl(id: number, payload: ControlPayload): Observable<ControlDTO> {
    const url = `${this.baseUrl}/${id}`;
    console.log('▶️ PUT', url, '\n📦 Payload:', JSON.stringify(payload, null, 2));
    return this.http.put<ControlDTO>(
        url,
        payload,
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(res => console.log(`✅ PUT control ${id}:`, res)),
        catchError(err => {
          console.error(`❌ PUT control ${id} error:`, err);
          return throwError(() => err);
        })
      );
  }

    toggleEstadoItem(itemId: number): Observable<ItemControlDTO> {
    const url = `${this.baseUrl}/items/${itemId}/estado`;
    return this.http
      .patch<ItemControlDTO>(url, null, { headers: this.getAuthHeaders() })
      .pipe(
        tap(res => console.log(`✅ PATCH estado ItemControl ${itemId}:`, res)),
        catchError(err => {
          console.error(`❌ PATCH estado ItemControl ${itemId} error:`, err);
          return throwError(() => err);
        })
      );
  }

    /** GET /api/controles/organizaciones */
  getOrganizaciones(): Observable<OrganizacionDTO[]> {
    const url = `${this.baseUrl}/organizaciones`;
    return this.http.get<OrganizacionDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(
        tap(list => console.log('✅ GET organizaciones:', list)),
        catchError(err => throwError(() => err))
      );
  }

  /** GET /api/controles/organizaciones/:orgId/items */
  getItemsPorOrganizacion(orgId: number): Observable<ItemControlDTO[]> {
    const url = `${this.baseUrl}/organizaciones/${orgId}/items`;
    return this.http.get<ItemControlDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(
        tap(list => console.log(`✅ GET items de org ${orgId}:`, list)),
        catchError(err => throwError(() => err))
      );
  }
}
