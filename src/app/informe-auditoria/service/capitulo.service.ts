import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CapituloDTO } from '../models/capitulo-dto';

@Injectable({ providedIn: 'root' })
export class CapituloService {
  private apiUrl = `${environment.apiUrl}/capitulos`;
  
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAll(): Observable<CapituloDTO[]> {
    return this.http.get<CapituloDTO[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getById(id: number): Observable<CapituloDTO> {
    return this.http.get<CapituloDTO>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createCapitulo(payload: CapituloDTO): Observable<CapituloDTO> {
    // Imprime el objeto como JSON
    console.log('JSON enviado al backend (Capítulo):', JSON.stringify(payload));
    return this.http.post<CapituloDTO>(this.apiUrl, payload, {
      headers: this.getAuthHeaders()
    });
  }

  updateCapitulo(id: number, payload: CapituloDTO): Observable<CapituloDTO> {
    return this.http.put<CapituloDTO>(`${this.apiUrl}/${id}`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  deleteCapitulo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /** Actualiza múltiples órdenes de capitulo */
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
