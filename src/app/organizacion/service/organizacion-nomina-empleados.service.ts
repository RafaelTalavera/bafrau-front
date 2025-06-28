import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrganizacionNominaEmpleadosService {

  private apiUrl = `${environment.apiUrl}/nomina-empleados`;

  constructor(private http: HttpClient) {}

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

  getEmpleados(organizacionId: number): Observable<any[]> {
    if (!organizacionId) {
      return throwError('El organizacionId es requerido');
    }
    return this.http.get<any[]>(`${this.apiUrl}/organizacion/${organizacionId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo empleados:', err);
          return throwError(err);
        })
      );
  }

  createEmpleado(empleado: any): Observable<any> {
    if (!empleado.informeId) {
      return throwError('El organzizacionId es requerido para crear un empleado');
    }
    return this.http.post<any>(this.apiUrl, empleado, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error creando empleado:', err);
          return throwError(err);
        })
      );
  }

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
