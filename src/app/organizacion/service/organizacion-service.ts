import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Organizacion } from '../models/organizacion.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {
  private apiUrl = `${environment.apiUrl}/organizaciones`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token'); 
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }


  getAllOrganizaciones(): Observable<Organizacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Organizacion[]>(this.apiUrl, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  createOrganizacion(organizacion: Organizacion): Observable<Organizacion> {
    const headers = this.getAuthHeaders();
    return this.http.post<Organizacion>(this.apiUrl, organizacion, { headers })
      .pipe(
        catchError(this.handleError),
      );
  }

  deleteOrganizacion(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError('Ocurrió un error; intenta de nuevo más tarde.');
  }

  updateOrganizacion(id: number, organizacion: Organizacion): Observable<Organizacion> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/${id}`;
    
    return this.http.put<Organizacion>(url, organizacion, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getOrganizacionById(id: number): Observable<Organizacion> {
    return this.http.get<Organizacion>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError((err) => {
        return throwError(err);
      })
    );
  }

    getOrganizacionesAuditoriaAmbiental(): Observable<Organizacion[]> {
      const url = `${this.apiUrl}/auditorias-ambientales`;
      return this.http
        .get<Organizacion[]>(url, { headers: this.getAuthHeaders() })
        .pipe(
          catchError(err => {
            return throwError(() => err);
          })
        );
    }
    
        getOrganizacionesRepresentacionTecnica(): Observable<Organizacion[]> {
          const url = `${this.apiUrl}/representacion-tecnica`;
          return this.http
            .get<Organizacion[]>(url, { headers: this.getAuthHeaders() })
            .pipe(
              catchError(err => {
                console.error('Error al cargar organizaciones:', err);
                return throwError(() => err);
              })
            );
        }
        
}
