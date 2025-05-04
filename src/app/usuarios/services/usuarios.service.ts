import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Usuario } from '../usuario';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';


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
    return this.http.post<Usuario>(this.baseUrl, usuario);
  }

  updateUsuario(usuario: Usuario): Observable<Usuario> {
    // Muestra en consola el objeto Usuario y su representación JSON
    console.log('Objeto Usuario a enviar:', usuario);
    console.log('Payload JSON:', JSON.stringify(usuario));
    
    return this.http
      .put<Usuario>(`${this.baseUrl}/${usuario.id}`, usuario);
  }
  

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
