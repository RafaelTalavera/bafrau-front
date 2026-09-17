import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DesvioDetalle, DesvioListItem, EstadoDesvio, EvidenciaDesvio, PageResponse, ResumenDesvios, SeguimientoDesvio } from '../models/desvio.model';

@Injectable({ providedIn: 'root' })
export class DesviosService {
  private readonly apiUrl = `${environment.apiUrl}/desvios`;
  constructor(private http: HttpClient) {}

  listar(filtros: { texto?: string; organizacionId?: number; estado?: EstadoDesvio; desde?: string; hasta?: string; page?: number; size?: number }): Observable<PageResponse<DesvioListItem>> {
    let params = new HttpParams().set('page', filtros.page ?? 0).set('size', filtros.size ?? 20).set('sort', 'fechaDeteccion,desc');
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'size') params = params.set(key, String(value));
    });
    return this.http.get<PageResponse<DesvioListItem>>(this.apiUrl, { params });
  }
  resumen(): Observable<ResumenDesvios> { return this.http.get<ResumenDesvios>(`${this.apiUrl}/resumen`); }
  obtener(id: number): Observable<DesvioDetalle> { return this.http.get<DesvioDetalle>(`${this.apiUrl}/${id}`); }
  actualizar(id: number, payload: object): Observable<DesvioDetalle> { return this.http.put<DesvioDetalle>(`${this.apiUrl}/${id}`, payload); }
  crear(payload: object): Observable<DesvioDetalle> { return this.http.post<DesvioDetalle>(this.apiUrl, payload); }
  agregarSeguimiento(id: number, payload: object): Observable<SeguimientoDesvio> { return this.http.post<SeguimientoDesvio>(`${this.apiUrl}/${id}/seguimientos`, payload); }
  actualizarSeguimiento(id: number, seguimientoId: number, payload: object): Observable<SeguimientoDesvio> {
    return this.http.put<SeguimientoDesvio>(`${this.apiUrl}/${id}/seguimientos/${seguimientoId}`, payload);
  }
  subirEvidencia(id: number, file: File, seguimientoId?: number): Observable<EvidenciaDesvio> {
    const data = new FormData(); data.append('file', file); data.append('descripcion', file.name);
    const url = seguimientoId ? `${this.apiUrl}/${id}/seguimientos/${seguimientoId}/evidencias` : `${this.apiUrl}/${id}/evidencias`;
    return this.http.post<EvidenciaDesvio>(url, data);
  }
}
