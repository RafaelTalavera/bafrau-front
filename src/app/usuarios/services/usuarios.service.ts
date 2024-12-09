import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Usuario } from '../../models/usuario';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private usuarios: Usuario[] = []

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

  findAll(): Observable<Usuario[]> {
    const url = 'https://appbafrau-production.up.railway.app/api/usuarios';
    const headers = this.getAuthHeaders();
    console.log('Encabezados enviados con la solicitud:', headers); // Imprimir los headers con el token

    console.log(`Este 1 Realizando solicitud GET aca: ${url}`);
    console.log('Encabezados enviados con la solicitud:', headers); // Imprimir los headers con el token

    return this.http.get<Usuario[]>(url, { headers }).pipe(
      tap(usuarios => {
        console.log('Respuesta del backend:', usuarios); // Imprimir la respuesta del backend
      })
    );
  }

  create (usuario: Usuario): Observable<Usuario>{
    
    return this.http.post<Usuario>('https://appbafrau-production.up.railway.app/api/usuarios',usuario);
  }

  updateUsuario(usuario: Usuario): Observable<Usuario> {
    const url = 'https://appbafrau-production.up.railway.app/api/usuarios/' + usuario.id;
    return this.http.put<Usuario>(url, usuario);
  }

  remove(id: number): Observable<void> {
    const url = 'https://appbafrau-production.up.railway.app/api/usuarios/' + id;
    return this.http.delete<void>(url);
  }
  
}
