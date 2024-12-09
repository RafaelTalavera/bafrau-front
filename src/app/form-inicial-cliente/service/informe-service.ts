import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Informe } from '../../models/informe.model';

@Injectable({
  providedIn: 'root'
})
export class InformeService {
  private apiUrl = 'https://appbafrau-production.up.railway.app/api/informes'; // URL de tu API

  constructor(private http: HttpClient) {}

  // Método para obtener los encabezados con el token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token'); // Asumiendo que guardas el token en localStorage
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Obtener todos los informes desde el backend
  getAllInformes(): Observable<Informe[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Informe[]>(this.apiUrl, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Método para crear un informe, enviando el token en los encabezados
  createInforme(informe: Informe): Observable<Informe> {
    console.log('Datos enviados al backend:', informe);
    const headers = this.getAuthHeaders();
    return this.http.post<Informe>(this.apiUrl, informe, { headers })
      .pipe(
        catchError(this.handleError),
      );
  }

  // Método para eliminar un informe por su ID
  deleteInforme(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse) {
    console.error('Error recibido del backend:', error);
    return throwError('Ocurrió un error; intenta de nuevo más tarde.');
  }

  updateInforme(id: number, informe: Informe): Observable<Informe> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/${id}`;
    
    // Imprimir en consola los datos que se enviarán
    console.log('Actualizando informe con ID:', id);
    console.log('Datos del informe a enviar:', informe);
    console.log('Encabezados de la solicitud:', headers);
  
    return this.http.put<Informe>(url, informe, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getInformeById(id: number): Observable<Informe> {
    return this.http.get<Informe>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError((err) => {
        console.error('Error obteniendo el informe por ID:', err);
        return throwError(err);
      })
    );
  }
  
  
}
