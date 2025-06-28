// src/app/service/encabezado.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EncabezadoDTO } from '../models/encabezado-dto';


@Injectable({ providedIn: 'root' })
export class EncabezadoService {
  private apiUrl = `${environment.apiUrl}/encabezados`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAll(): Observable<EncabezadoDTO[]> {
    return this.http.get<EncabezadoDTO[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getById(id: number): Observable<EncabezadoDTO> {
    return this.http.get<EncabezadoDTO>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  createEncabezado(payload: EncabezadoDTO): Observable<EncabezadoDTO> {
    console.log('JSON enviado al backend (Encabezado):', JSON.stringify(payload));
    return this.http.post<EncabezadoDTO>(this.apiUrl, payload, {
      headers: this.getAuthHeaders()
    });
  }

  updateEncabezado(id: number, payload: EncabezadoDTO): Observable<EncabezadoDTO> {
    return this.http.put<EncabezadoDTO>(`${this.apiUrl}/${id}`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  deleteEncabezado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

    getByInformeId(informeId: number): Observable<EncabezadoDTO[]> {
    return this.http.get<EncabezadoDTO[]>(
      `${this.apiUrl}/informe/${informeId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
