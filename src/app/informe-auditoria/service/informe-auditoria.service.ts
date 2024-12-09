import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InformeDTO } from './informe-dto.models';

@Injectable({
  providedIn: 'root'
})
export class InformeAuditoriaService {

  private apiUrl = 'http://localhost:8080/api/informes'; 

  constructor(private http: HttpClient) { }


    // Método para obtener los encabezados con el token
    private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('jwt_token'); // Asumiendo que guardas el token en localStorage
      let headers = new HttpHeaders();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }

    obtenerRazonesSociales(): Observable<InformeDTO[]> {
      const url = `${this.apiUrl}/razonesSociales`;
      const headers = this.getAuthHeaders();
      return this.http.get<InformeDTO[]>(url, { headers });
    }

}
