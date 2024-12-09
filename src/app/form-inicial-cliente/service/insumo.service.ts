import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InsumoService {

  private apiUrl = 'https://appbafrau-production.up.railway.app/api/insumos'; // URL de la API para Insumos

  constructor(private http: HttpClient) { }

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

  // Obtener insumos por procesoId
  getInsumos(procesoId: number): Observable<any[]> {
    if (!procesoId) {
      return throwError('El procesoId es requerido');
    }
    return this.http.get<any[]>(`${this.apiUrl}/proceso/${procesoId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo insumos:', err);
          return throwError(err);
        })
      );
  }

  // Crear insumo
  createInsumo(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders(); // No es necesario 'Content-Type' aquí, Angular lo maneja
    return this.http.post<any>(this.apiUrl, formData, { headers })
      .pipe(
        catchError(err => {
          console.error('Error creando insumo:', err);
          return throwError(err);
        })
      );
  }


  // Eliminar insumo
  deleteInsumo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error eliminando insumo:', err);
          return throwError(err);
        })
      );
  }


  getInsumosByInformeId(informeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/informe/${informeId}`);
  }


}
