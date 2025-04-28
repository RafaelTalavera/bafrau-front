// src/app/service/matriz-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItemUIPUpdateDTO } from '../../matriz/ponderacion-matriz/ponderacion-matriz.component';
import { environment } from '../../../enviroments/enviroment';
import { Matriz } from '../models/matriz';

@Injectable({
  providedIn: 'root'
})
export class MatrizService {
  private baseUrl = `${environment.apiUrl}/matrices`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.error('No se encontró el token de autenticación');
    }
    return headers;
  }

  /** Obtiene todas las matrices */
  getAllMatrices(): Observable<Matriz[]> {
    return this.http.get<Matriz[]>(this.baseUrl, { headers: this.getAuthHeaders() });
  }

  /** Obtiene una matriz por ID */
  getMatrizById(id: number): Observable<Matriz> {
    return this.http.get<Matriz>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  /** Crea una nueva matriz (con purga de payload) */
  createMatriz(matriz: Matriz): Observable<Matriz> {
    const headers = this.getAuthHeaders();

    // Purga para ver el JSON que se envía
    console.log('JWT enviado:', headers.get('Authorization'));
    console.log('Payload createMatriz:', JSON.stringify(matriz, null, 2));

    return this.http.post<Matriz>(this.baseUrl, matriz, { headers });
  }

  /** Actualiza una matriz existente */
  updateMatriz(id: number, matriz: Matriz): Observable<Matriz> {
    return this.http.put<Matriz>(`${this.baseUrl}/${id}`, matriz, { headers: this.getAuthHeaders() });
  }

  /** Elimina una matriz por ID */
  deleteMatriz(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  /** Actualiza el UIP de una matriz (con purga de endpoint y payload) */
  updateUPI(id: number, updates: ItemUIPUpdateDTO[]): Observable<Matriz> {
    const endpoint = `${this.baseUrl}/${id}/uip`;
    console.log('Enviando PUT a:', endpoint);
    console.log('Payload de actualización UIP:', JSON.stringify(updates, null, 2));
    return this.http.put<Matriz>(endpoint, updates, { headers: this.getAuthHeaders() });
  }
}
