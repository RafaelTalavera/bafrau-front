// src/app/service/matriz-service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ItemUIPUpdateDTO } from '../matriz-ponderacion/ponderacion-matriz.component';
import { environment } from '../../../enviroments/enviroment';
import { Matriz } from '../models/matriz';
import { Organizacion } from '../../organizacion/models/organizacion.model';


@Injectable({
  providedIn: 'root'
})
export class MatrizService {
  private baseUrl = `${environment.apiUrl}/matrices`;
  private orgUrl  = `${environment.apiUrl}/organizaciones/auditorias-ambientales`;  // nuevo

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
    return this.http
      .get<Matriz[]>(this.baseUrl, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  /** Obtiene una matriz por ID */
  getMatrizById(id: number): Observable<Matriz> {
    return this.http
      .get<Matriz>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  /** Crea una nueva matriz */
  createMatriz(matriz: Matriz): Observable<Matriz> {
    const headers = this.getAuthHeaders();
    console.log('JWT enviado:', headers.get('Authorization'));
    console.log('Payload createMatriz:', JSON.stringify(matriz, null, 2));
    return this.http
      .post<Matriz>(this.baseUrl, matriz, { headers })
      .pipe(catchError(err => throwError(() => err)));
  }

  /** Actualiza una matriz existente */
  updateMatriz(id: number, matriz: Matriz): Observable<Matriz> {
    const endpoint = `${this.baseUrl}/${id}`;
    console.log('🔗 [HTTP PUT] URL:', endpoint);
    console.log('📤 [PAYLOAD]:', JSON.stringify(matriz, null, 2));
    return this.http
      .put<Matriz>(endpoint, matriz, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('❌ Error en updateMatriz:', err);
          return throwError(() => err);
        })
      );
  }


  /** Elimina una matriz por ID */
  deleteMatriz(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  /** Actualiza el UIP de una matriz */
  updateUPI(id: number, updates: ItemUIPUpdateDTO[]): Observable<Matriz> {
    const endpoint = `${this.baseUrl}/${id}/uip`;
    console.log('Enviando PUT a:', endpoint);
    console.log('Payload de actualización UIP:', JSON.stringify(updates, null, 2));
    return this.http
      .put<Matriz>(endpoint, updates, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }
}
