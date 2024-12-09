import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProcedimientoService {

  private apiUrl = 'https://appbafrau-production.up.railway.app/api/procedimientos'; // URL de la API para Procedimientos

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
  

  // Obtener procedimientos por informeId
  getProcedimientosByInformeId(informeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/informe/${informeId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo procedimientos:', err);
          return throwError(err);
        })
      );
  }

  // Crear procedimiento
  createProcedimiento(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, formData, { headers })
      .pipe(
        catchError(err => {
          console.error('Error creando procedimiento:', err);
          return throwError(err);
        })
      );
  }

  // Eliminar procedimiento
  deleteProcedimiento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error eliminando procedimiento:', err);
          return throwError(err);
        })
      );
  }

  getProcedimientos(informeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/informe/${informeId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo procedimientos:', err);
          return throwError(err);
        })
      );
  }
}
