import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NominaService {

  private apiUrl = 'https://appbafrau-production.up.railway.app/api/nomina-empleados'; // 

  constructor(private http: HttpClient) {}

  // Obtener encabezados con token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token'); // Asumiendo que guardas el token en localStorage
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      throwError('No se encontró el token de autenticación');
    }
    return headers;
  }

  // Obtener empleados por informeId
  getEmpleados(informeId: number): Observable<any[]> {
    if (!informeId) {
      return throwError('El informeId es requerido');
    }
    return this.http.get<any[]>(`${this.apiUrl}/informe/${informeId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo empleados:', err);
          return throwError(err);
        })
      );
  }

  // Crear empleado
  createEmpleado(empleado: any): Observable<any> {
    if (!empleado.informeId) {
      return throwError('El informeId es requerido para crear un empleado');
    }
    return this.http.post<any>(this.apiUrl, empleado, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error creando empleado:', err);
          return throwError(err);
        })
      );
  }

  // Eliminar empleado
  deleteEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error eliminando empleado:', err);
          return throwError(err);
        })
      );
  }
}
