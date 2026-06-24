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

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  createControl(payload: ControlPayload): Observable<ControlDTO> {
    return this.http.post<ControlDTO>(
      this.baseUrl,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(res => console.log('POST control:', res)),
      catchError(err => throwError(() => err))
    );
  }

  getControles(): Observable<ControlDTO[]> {
    return this.http
      .get<ControlDTO[]>(this.baseUrl, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  getControl(id: number): Observable<ControlDTO> {
    const url = `${this.baseUrl}/${id}`;
    return this.http
      .get<ControlDTO>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  getControlesPorOrganizacion(orgId: number): Observable<ControlDTO[]> {
    const url = `${this.baseUrl}/organizaciones/${orgId}/controles`;
    return this.http
      .get<ControlDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  deleteControl(id: number): Observable<void> {
    const url = `${this.baseUrl}/${id}`;
    return this.http
      .delete<void>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  updateControl(id: number, payload: ControlPayload): Observable<ControlDTO> {
    const url = `${this.baseUrl}/${id}`;
    return this.http
      .put<ControlDTO>(url, payload, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  toggleEstadoItem(itemId: number): Observable<ItemControlDTO> {
    const url = `${this.baseUrl}/items/${itemId}/estado`;
    return this.http
      .patch<ItemControlDTO>(url, null, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  getOrganizaciones(): Observable<OrganizacionDTO[]> {
    const url = `${this.baseUrl}/organizaciones`;
    return this.http
      .get<OrganizacionDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  getItemsPorOrganizacion(orgId: number): Observable<ItemControlDTO[]> {
    const url = `${this.baseUrl}/organizaciones/${orgId}/items`;
    return this.http.get<ItemControlDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(
        tap(list => console.log(`GET items de org ${orgId}:`, list)),
        catchError(err => throwError(() => err))
      );
  }

  getItemsEliminadosPorOrganizacion(orgId: number): Observable<ItemControlDTO[]> {
    const url = `${this.baseUrl}/organizaciones/${orgId}/items-eliminados`;
    return this.http
      .get<ItemControlDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  getItems(): Observable<ItemControlDTO[]> {
    const url = `${this.baseUrl}/items`;
    return this.http
      .get<ItemControlDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  deleteItem(itemId: number): Observable<void> {
    const url = `${this.baseUrl}/items/${itemId}`;
    return this.http
      .delete<void>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  restoreItem(itemId: number): Observable<ItemControlDTO> {
    const url = `${this.baseUrl}/items/${itemId}/restaurar`;
    return this.http
      .patch<ItemControlDTO>(url, null, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }
}
