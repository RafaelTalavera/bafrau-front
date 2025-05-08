import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Documento } from '../models/documento';


@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private baseUrl = environment.apiUrl;  
  private apiPath = '/documentos';
  private documentos: Documento[] = [];

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

  findAll(): Observable<Documento[]> {
    const url = `${this.baseUrl}${this.apiPath}`;
    return this.http.get<Documento[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(docs => console.log('✅ GET documentos:', docs)),
      catchError(err => {
        console.error('❌ GET error:', err);
        return throwError(() => err);
      })
    );
  }

  create(documento: Documento): Observable<Documento> {
    const url = `${this.baseUrl}${this.apiPath}`;
    return this.http.post<Documento>(url, documento, { headers: this.getAuthHeaders() }).pipe(
      tap(res => console.log('✅ POST response:', res)),
      catchError(err => {
        console.error('❌ POST error:', err);
        return throwError(() => err);
      })
    );
  }

  updateDocumento(documento: Documento): Observable<Documento> {
    const url = `${this.baseUrl}${this.apiPath}/${documento.id}`;
    const payload = JSON.stringify(documento, null, 2);
    console.log('▶️ PUT', url, '\n📦 Payload:', payload);
    return this.http.put<Documento>(url, documento, { headers: this.getAuthHeaders() }).pipe(
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
