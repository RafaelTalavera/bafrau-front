import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Residuo } from '../models/residuo';



@Injectable({
  providedIn: 'root'
})
export class ResiduoService {
  private baseUrl = environment.apiUrl;  
  private apiPath = '/residuos';
  private residuos: Residuo[] = [];

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

  findAll(): Observable<Residuo[]> {
    const url = `${this.baseUrl}${this.apiPath}`;
    return this.http.get<Residuo[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(res => console.log('✅ GET residuos:', res)),
      catchError(err => {
        console.error('❌ GET error:', err);
        return throwError(() => err);
      })
    );
  }

  create(residuo: Residuo): Observable<Residuo> {
    const url = `${this.baseUrl}${this.apiPath}`;
    return this.http.post<Residuo>(url, residuo, { headers: this.getAuthHeaders() }).pipe(
      tap(res => console.log('✅ POST response:', res)),
      catchError(err => {
        console.error('❌ POST error:', err);
        return throwError(() => err);
      })
    );
  }

  updateResiduo(residuo: Residuo): Observable<Residuo> {
    const url = `${this.baseUrl}${this.apiPath}/${residuo.id}`;
    const payload = JSON.stringify(residuo, null, 2);
    console.log('▶️ PUT', url, '\n📦 Payload:', payload);
    return this.http.put<Residuo>(url, residuo, { headers: this.getAuthHeaders() }).pipe(
      tap(res => console.log('✅ PUT response:', res)),
      catchError(err => {
        console.error('❌ PUT error:', err);
        return throwError(() => err);
      })
    );
  }

  remove(id: number): Observable<void> {
    const url = `${this.baseUrl}${this.apiPath}/${id}`;
    return this.http.delete<void>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(() => console.log(`✅ DELETE Residuo ${id}`)),
      catchError(err => {
        console.error('❌ DELETE error:', err);
        return throwError(() => err);
      })
    );
  }
}
