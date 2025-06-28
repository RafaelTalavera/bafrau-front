
import { HttpClient, HttpParams, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { AdjuntoDTO } from './adjunto-dto';


@Injectable({
  providedIn: 'root'
})
export class AdjuntosService {
  private readonly BASE_URL = `${environment.apiUrl}/adjunto`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AdjuntoDTO[]> {
    return this.http.get<AdjuntoDTO[]>(`${this.BASE_URL}`);
  }

  getById(id: number): Observable<AdjuntoDTO> {
    return this.http.get<AdjuntoDTO>(`${this.BASE_URL}/${id}`);
  }

  getByOrganizacionId(organizacionId: number): Observable<AdjuntoDTO[]> {
    return this.http.get<AdjuntoDTO[]>(
      `${this.BASE_URL}/organizacion/${organizacionId}`
    );
  }

  uploadAdjunto(
    file: File,
    descripcion: string,
    informeId: number
  ): Observable<AdjuntoDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('descripcion', descripcion);
    formData.append('informeId', informeId.toString());

    return this.http.post<AdjuntoDTO>(`${this.BASE_URL}`, formData);
  }

  updateAdjunto(
    id: number,
    file?: File,
    descripcion?: string
  ): Observable<AdjuntoDTO> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (descripcion != null) {
      formData.append('descripcion', descripcion);
    }

    return this.http.put<AdjuntoDTO>(
      `${this.BASE_URL}/${id}`,
      formData
    );
  }


  deleteAdjunto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }

  ploadAdjuntoSeccion(
    file: File,
    descripcion: string,
    seccionId: number
  ): Observable<AdjuntoDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('descripcion', descripcion);
    formData.append('seccionId', seccionId.toString());

    return this.http.post<AdjuntoDTO>(
      `${this.BASE_URL}/seccion`,
      formData
    );
  }

  ploadAdjuntoEncabezado(
  file: File,
  descripcion: string,
  encabezadoId: number
): Observable<AdjuntoDTO> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('descripcion', descripcion);
  formData.append('encabezadoId', encabezadoId.toString());

  return this.http.post<AdjuntoDTO>(
    `${this.BASE_URL}/encabezado`,
    formData
  );
}
}