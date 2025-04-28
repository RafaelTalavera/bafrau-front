import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Accion } from '../../models/accion';



@Injectable({
  providedIn: 'root'
})
export class AccionService {

  private acciones: Accion[] = []

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

  findAll(): Observable<Accion[]> {
    const url = 'http://localhost:8080/api/acciones';
    const headers = this.getAuthHeaders();
    return this.http.get<Accion[]>(url, { headers }).pipe(
    );
  }

  create (accion: Accion): Observable<Accion>{
    const url = 'http://localhost:8080/api/acciones';
    const headers = this.getAuthHeaders();
    return this.http.post<Accion>(url,accion, { headers }).pipe(
    );
  }

  updateAccion(accion: Accion): Observable<Accion> {
    const url = 'http://localhost:8080/api/acciones/' + accion.id;
    const headers = this.getAuthHeaders();
    return this.http.put<Accion>(url, accion, { headers }).pipe();
  }

  remove(id: number): Observable<void> {
    const url = 'http://localhost:8080/api/acciones/' + id;
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(url, { headers }).pipe();
  }
  
}
