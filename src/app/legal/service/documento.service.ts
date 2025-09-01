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
    
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

findAll(): Observable<Documento[]> {
  const url = `${this.baseUrl}${this.apiPath}`;
  return this.http
    .get<Documento[]>(url, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}


create(documento: Documento): Observable<Documento> {
  const url = `${this.baseUrl}${this.apiPath}`;
  return this.http
    .post<Documento>(url, documento, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}


 updateDocumento(documento: Documento): Observable<Documento> {
  const url = `${this.baseUrl}${this.apiPath}/${documento.id}`;
  return this.http
    .put<Documento>(url, documento, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}


remove(id: number): Observable<void> {
  const url = `${this.baseUrl}${this.apiPath}/${id}`;
  return this.http
    .delete<void>(url, { headers: this.getAuthHeaders() })
    .pipe(
      catchError(err => throwError(() => err))
    );
}

}
