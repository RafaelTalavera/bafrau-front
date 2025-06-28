// src/app/service/tabla.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { CeldaDTO, TablaDTO } from '../models/tabla-dto.model';

@Injectable({
  providedIn: 'root'
})
export class TablaService {
  private baseUrl = `${environment.apiUrl}/tablas`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      
    }
    return headers;
  }

  /** Obtiene todas las tablas de una sección */
  getTablasPorSeccion(seccionId: number): Observable<TablaDTO[]> {
    const url = `${this.baseUrl}/seccion/${seccionId}`;
    return this.http
      .get<TablaDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => {
        return throwError(() => err);
      }));
  }

  /** Crea una tabla dinámica con filas y columnas vacías */
  crearTabla(
    numFilas: number,
    numColumnas: number,
    seccionId: number,
    nombre: string
  ): Observable<TablaDTO> {
    const params = new HttpParams()
      .set('filas', numFilas.toString())
      .set('columnas', numColumnas.toString())
      .set('seccionId', seccionId.toString())
      .set('nombre', nombre);

    return this.http
      .post<TablaDTO>(this.baseUrl, null, {
        headers: this.getAuthHeaders(),
        params
      })
      .pipe(catchError(err => {       
        return throwError(() => err);
      }));
  }

  /** Edita en lote el contenido de varias celdas */
  editarCeldas(celdas: CeldaDTO[]): Observable<void> {
    const url = `${environment.apiUrl}/tablas/editar-masivo`;
    return this.http
      .put<void>(url, celdas, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => {
        return throwError(() => err);
      }));
  }

    /** Elimina una tabla por su ID */
  deleteTabla(tablaId: number): Observable<void> {
    const url = `${this.baseUrl}/${tablaId}`;
    return this.http
      .delete<void>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

}
