import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Usuario } from '../usuario';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private usuarios: Usuario[] = [];
  private baseUrl = environment.apiUrl + '/usuarios';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  findAll(): Observable<Usuario[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Usuario[]>(this.baseUrl, { headers }).pipe(
      tap(usuarios => console.log('Respuesta del backend:', usuarios))
    );
  }

  create(usuario: Usuario): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http.post<Usuario>(this.baseUrl, usuario, { headers });
  }

  updateUsuario(usuario: Usuario): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<Usuario>(`${this.baseUrl}/${usuario.id}`, usuario, { headers });
  }
  
  remove(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers });
  }

  bloquearUsuario(id: number): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/bloquear`, {}, { headers });
  }

  desbloquearUsuario(id: number): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/desbloquear`, {}, { headers });
  }
}
