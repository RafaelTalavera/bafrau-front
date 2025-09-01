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
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** POST /api/controles */
  createControl(payload: ControlPayload): Observable<ControlDTO> {    
    return this.http.post<ControlDTO>(
        this.baseUrl,
        payload,
        { headers: this.getAuthHeaders() }
      ).pipe(
        tap(res => console.log('✅ POST control:', res)),
        catchError(err => {
       
          return throwError(() => err);
        })
      );
  }

/** GET /api/controles */
getControles(): Observable<ControlDTO[]> {
  return this.http
    .get<ControlDTO[]>(this.baseUrl, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}

/** GET /api/controles/:id */
getControl(id: number): Observable<ControlDTO> {
  const url = `${this.baseUrl}/${id}`;
  return this.http
    .get<ControlDTO>(url, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}

/** DELETE /api/controles/:id */
deleteControl(id: number): Observable<void> {
  const url = `${this.baseUrl}/${id}`;
  return this.http
    .delete<void>(url, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}

/** PUT /api/controles/:id */
updateControl(id: number, payload: ControlPayload): Observable<ControlDTO> {
  const url = `${this.baseUrl}/${id}`;
  return this.http
    .put<ControlDTO>(url, payload, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}


toggleEstadoItem(itemId: number): Observable<ItemControlDTO> {
  const url = `${this.baseUrl}/items/${itemId}/estado`;
  return this.http
    .patch<ItemControlDTO>(url, null, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}

/** GET /api/controles/organizaciones */
getOrganizaciones(): Observable<OrganizacionDTO[]> {
  const url = `${this.baseUrl}/organizaciones`;
  return this.http
    .get<OrganizacionDTO[]>(url, { headers: this.getAuthHeaders() })
    .pipe(
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

    /** GET /api/controles/items
   *  Devuelve el listado completo de todos los ítems de control.
   */
  getItems(): Observable<ItemControlDTO[]> {
    const url = `${this.baseUrl}/items`;
    return this.http
      .get<ItemControlDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => throwError(() => err))
      );
  }

    deleteItem(itemId: number): Observable<void> {
    const url = `${this.baseUrl}/items/${itemId}`;
    return this.http
      .delete<void>(url, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => throwError(() => err))
      );
  }

}
