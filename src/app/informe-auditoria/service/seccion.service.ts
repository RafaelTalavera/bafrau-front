import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SeccionDTO } from '../models/seccion-dto';
import { environment } from '../../../environments/environment';
import { AdjuntoDTO } from '../../utils/adjunto-dto';

@Injectable({
  providedIn: 'root'
})
export class SeccionService {
  private apiUrl = `${environment.apiUrl}/secciones`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAll(): Observable<SeccionDTO[]> {
    return this.http.get<SeccionDTO[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getById(id: number): Observable<SeccionDTO> {
    return this.http.get<SeccionDTO>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createSeccion(payload: SeccionDTO): Observable<SeccionDTO> {
    console.log('JSON enviado al backend (Sección):', JSON.stringify(payload));
    const headers = this.getAuthHeaders()
      .set('Content-Type', 'application/json');
    return this.http.post<SeccionDTO>(this.apiUrl, payload, { headers });
  }

  updateSeccion(id: number, payload: SeccionDTO): Observable<SeccionDTO> {
    return this.http.put<SeccionDTO>(`${this.apiUrl}/${id}`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  deleteSeccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  uploadAdjunto(file: File, seccionId: number): Observable<AdjuntoDTO> {
  const url = `${this.apiUrl}/${seccionId}/adjuntos`;
  const form = new FormData();
  form.append('file', file, file.name);
  return this.http.post<AdjuntoDTO>(url, form, {
    headers: this.getAuthHeaders()  // omitimos Content-Type
  });
}

/** Actualiza múltiples órdenes de sección */
updateOrdenBulk(payload: { id: number; orden: number }[]): Observable<void> {
  const headers = this.getAuthHeaders()
    .set('Content-Type', 'application/json');
  return this.http.put<void>(
    `${this.apiUrl}/ordenes`,
    payload,
    { headers }
  );
}


}
