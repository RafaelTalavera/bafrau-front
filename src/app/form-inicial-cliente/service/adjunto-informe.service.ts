import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdjuntoInformeService {

  private apiUrl = 'https://appbafrau-production.up.railway.app/api/adjunto-informe'; // URL de la API para Procedimientos

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
  

  // Obtener adjunto informe por informeId
  getAdjuntoInformeByInformeId(informeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/informe/${informeId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo los adjuntos del informe:', err);
          return throwError(err);
        })
      );
  }

  // Crear adjunto Informe
  createAdjuntoInforme(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, formData, { headers })
      .pipe(
        catchError(err => {
          console.error('Error crear adjunto informe:', err);
          return throwError(err);
        })
      );
  }

  // Eliminar adjunto informe
  deleteAdjuntoInforme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error eliminando adjunto informe:', err);
          return throwError(err);
        })
      );
  }

  getAdjuntoInforme(informeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/informe/${informeId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(err => {
          console.error('Error obteniendo adjunto Informe:', err);
          return throwError(err);
        })
      );
  }
}
