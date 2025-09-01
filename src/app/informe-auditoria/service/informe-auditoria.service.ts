import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { InformeDTO } from '../models/informe-dto.models';
import { environment } from '../../../environments/environment';
import { InformePreviewDTO } from '../models/informe-preview-dto.models';

@Injectable({
  providedIn: 'root'
})
export class InformeAuditoriaService {
  private readonly BASE_URL = `${environment.apiUrl}/informes`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<InformeDTO[]> {
    return this.http.get<InformeDTO[]>(`${this.BASE_URL}/light`);
  }

  getById(id: number): Observable<InformeDTO> {
    return this.http.get<InformeDTO>(`${this.BASE_URL}/${id}`);
  }

  getPreview(id: number): Observable<InformePreviewDTO> {
    return this.http.get<InformePreviewDTO>(`${this.BASE_URL}/${id}/preview`);
  }

  create(dto: InformeDTO): Observable<InformeDTO> {
    // Log del objeto que se envía
    console.log('Enviando JSON:', dto);

    return this.http.post<InformeDTO>(`${this.BASE_URL}`, dto).pipe(
      tap(respuesta => {
        console.log('Respuesta del backend:', respuesta);
      })
    );
  }


  update(id: number, dto: InformeDTO): Observable<InformeDTO> {
    return this.http.put<InformeDTO>(`${this.BASE_URL}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }
}
