import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  private apiUrl = 'https://appbafrau-production.up.railway.app/api/servicios';

  constructor(private http: HttpClient) {}

  // Obtener encabezados con token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Obtener servicios por informeId
  getServicios(informeId: number): Observable<any[]> {
    if (!informeId) {
      return throwError('El informeId es requerido');
    }
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/informe/${informeId}`, { headers })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo los servicios:', err);
          return throwError(err);
        })
      );
  }

  // Crear servicio
  createServicio(servicio: any): Observable<any> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    return this.http.post<any>(this.apiUrl, servicio, { headers })
      .pipe(
        catchError(err => {
          console.error('Error creando servicio:', err);
          return throwError(err);
        })
      );
  }

  // Eliminar servicio
  deleteServicio(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        catchError(err => {
          console.error('Error eliminando servicio:', err);
          return throwError(err);
        })
      );
  }
}
