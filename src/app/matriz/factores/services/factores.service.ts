import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Factor } from '../../../models/factor';

@Injectable({
  providedIn: 'root'
})
export class FactorService {
  private factores: Factor[] = []

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    console.log(`token aca: ${token}`);
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  findAll(): Observable<Factor[]> {
    const url = 'http://localhost:8080/api/factores';
    const headers = this.getAuthHeaders();
    return this.http.get<Factor[]>(url, { headers }).pipe(
    );
  }

  create(factor: Factor): Observable<Factor> {
    const url = 'http://localhost:8080/api/factores';
    const headers = this.getAuthHeaders();
    return this.http.post<Factor>(url, factor, { headers }).pipe(
    );
  }

  updateFactor(factor: Factor): Observable<Factor> {
    const url = 'http://localhost:8080/api/factores/' + factor.id;
    const headers = this.getAuthHeaders();
    const factorJson = JSON.stringify(factor);
    return this.http.put<Factor>(url, factor, { headers }).pipe(
    );
  }
  

  remove(id: number): Observable<void> {
    const url = 'http://localhost:8080/api/factores/' + id;
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(url, { headers }).pipe();
  }
}
