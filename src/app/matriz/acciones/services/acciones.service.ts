import { Injectable } from '@angular/core';
import { map, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Accion } from '../../models/accion';
import { environment } from '../../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AccionService {
  private baseUrl = environment.apiUrl;     
  private apiPath = '/acciones';
  private acciones: Accion[] = [];

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    console.log(`token acá: ${token}`);
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  findAll(): Observable<Accion[]> {
    const url = `${this.baseUrl}${this.apiPath}`;
    return this.http.get<Accion[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(list => console.log('✅ GET acciones:', list)),
      catchError(err => {
        console.error('❌ GET acciones error:', err);
        return throwError(() => err);
      })
    );
  }

  create(accion: Accion): Observable<Accion> {
    const url = `${this.baseUrl}${this.apiPath}`;
    return this.http.post<Accion>(url, accion, { headers: this.getAuthHeaders() }).pipe(
      tap(newAccion => console.log('✅ POST acción creada:', newAccion)),
      catchError(err => {
        console.error('❌ POST acción error:', err);
        return throwError(() => err);
      })
    );
  }

  updateAccion(accion: Accion): Observable<Accion> {
    const url = `${this.baseUrl}${this.apiPath}/${accion.id}`;
    console.log('▶️ PUT', url, '\n📦 Payload:', JSON.stringify(accion, null, 2));
    return this.http.put<Accion>(url, accion, { headers: this.getAuthHeaders() }).pipe(
      tap(updated => console.log('✅ PUT acción:', updated)),
      catchError(err => {
        console.error('❌ PUT acción error:', err);
        return throwError(() => err);
      })
    );
  }

  remove(id: number): Observable<void> {
    const url = `${this.baseUrl}${this.apiPath}/${id}`;
    return this.http.delete<void>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(() => console.log(`✅ DELETE acción ${id}`)),
      catchError(err => {
        console.error('❌ DELETE acción error:', err);
        return throwError(() => err);
      })
    );
  }
}
