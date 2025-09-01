// src/app/service/caratula.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CaratulaDTO } from '../models/caratula-dto';
import { AdjuntoDTO } from '../../utils/adjunto-dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CaratulaService {
  private apiUrl = `${environment.apiUrl}/caratulas`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** Obtener todas las carátulas de un informe */
  getByInforme(informeId: number): Observable<CaratulaDTO[]> {
    return this.http.get<CaratulaDTO[]>(
      `${this.apiUrl}/informe/${informeId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Crear carátula (incluye adjuntos en payload.adjuntos) */
  createCaratula(payload: CaratulaDTO): Observable<CaratulaDTO> {
    // 👉 PURGA: volcar en consola el objeto que se enviará
    console.log('Enviando payload Caratula al backend:', JSON.stringify(payload));

    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    return this.http.post<CaratulaDTO>(this.apiUrl, payload, { headers });
  }

  /** Actualizar carátula (gestión de adjuntos con payload.adjuntosIds) */
  updateCaratula(id: number, payload: CaratulaDTO): Observable<CaratulaDTO> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    return this.http.put<CaratulaDTO>(`${this.apiUrl}/${id}`, payload, { headers });
  }

  /** Eliminar carátula */
  deleteCaratula(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Subir un adjunto (imagen) a la carátula */
  uploadAdjunto(file: File, caratulaId: number): Observable<AdjuntoDTO> {
    const url = `${this.apiUrl}/${caratulaId}/adjuntos`;
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<AdjuntoDTO>(url, form, { headers: this.getAuthHeaders() });
  }
}
