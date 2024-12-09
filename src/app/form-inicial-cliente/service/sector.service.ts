import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SectorService {

  private apiUrl = 'https://appbafrau-production.up.railway.app/api/sectores';

  constructor(private http: HttpClient) {}

  // Obtener encabezados con token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token'); 
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      throwError('No se encontró el token de autenticación');
    }
    return headers;
  }

  // Obtener empleados por informeId
  getSectores(informeId: number): Observable<any[]> {
    if (!informeId) {
      return throwError('El informeId es requerido');
    }
    return this.http.get<any[]>(`${this.apiUrl}/informe/${informeId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo sectores:', err);
          return throwError(err);
        })
      );
  }

  // Crear empleado
  createSector(sector: any): Observable<any> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');
    return this.http.post<any>(this.apiUrl, sector, { headers })
      .pipe(
        catchError(err => {
          console.error('Error creando sector:', err);
          return throwError(err);
        })
      );
  }
  

  // Eliminar empleado
  deleteSector(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error eliminando sector:', err);
          return throwError(err);
        })
      );
  }
}
