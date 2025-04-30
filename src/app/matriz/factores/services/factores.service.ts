import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Factor } from '../../models/factor';
import { environment } from '../../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class FactorService {
  private baseUrl = environment.apiUrl;  
  private apiPath = '/factores';
  private factores: Factor[] = [];

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

  findAll(): Observable<Factor[]> {
    const url = `${this.baseUrl}${this.apiPath}`;
    return this.http.get<Factor[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(facs => console.log('✅ GET factores:', facs)),
      catchError(err => {
        console.error('❌ GET error:', err);
        return throwError(() => err);
      })
    );
  }

  create(factor: Factor): Observable<Factor> {
    const url = `${this.baseUrl}${this.apiPath}`;
    return this.http.post<Factor>(url, factor, { headers: this.getAuthHeaders() }).pipe(
      tap(res => console.log('✅ POST response:', res)),
      catchError(err => {
        console.error('❌ POST error:', err);
        return throwError(() => err);
      })
    );
  }

  updateFactor(factor: Factor): Observable<Factor> {
    const url = `${this.baseUrl}${this.apiPath}/${factor.id}`;
    const payload = JSON.stringify(factor, null, 2);
    console.log('▶️ PUT', url, '\n📦 Payload:', payload);
    return this.http.put<Factor>(url, factor, { headers: this.getAuthHeaders() }).pipe(
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
      tap(() => console.log(`✅ DELETE factor ${id}`)),
      catchError(err => {
        console.error('❌ DELETE error:', err);
        return throwError(() => err);
      })
    );
  }
}
