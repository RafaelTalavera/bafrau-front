import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Matriz } from '../../../models/matriz';


@Injectable({
  providedIn: 'root'
})
export class InformeService {
  private apiUrl = 'http://localhost:8080/api/informes'; 

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

  createInforme(informeRequestDTO: Matriz): Observable<Matriz> {
    // Imprime el objeto informeRequestDTO en la consola antes de enviar la solicitud POST
    console.log('JSON que se va a enviar:', informeRequestDTO);

    const headers = this.getAuthHeaders();

    // Realiza la solicitud POST y retorna el Observable del resultado
    return this.http.post<Matriz>(`${this.apiUrl}`, informeRequestDTO, { headers }).pipe(
    );
  }
}
