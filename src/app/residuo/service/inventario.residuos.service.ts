
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Inventario } from '../models/inventario';
import { environment } from '../../../environments/environment';
import { ItemInventario } from '../models/ItemInventario';
import { InventarioPayload } from '../models/inventario-payload';


@Injectable({ providedIn: 'root' })
export class InventarioService {
  private apiUrl = `${environment.apiUrl}/inventarios`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getInventarios(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getInventarioById(id: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createInventario(payload: InventarioPayload): Observable<Inventario> {
    // Imprime el objeto como JSON
    console.log('JSON enviado al backend:', JSON.stringify(payload));
    return this.http.post<Inventario>(this.apiUrl, payload, { headers: this.getAuthHeaders() });
  }

  updateInventario(id: number, payload: InventarioPayload): Observable<Inventario> {
    return this.http.put<Inventario>(`${this.apiUrl}/${id}`, payload, { headers: this.getAuthHeaders() });
  }

  deleteInventario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getItemsByInventario(id: number): Observable<ItemInventario[]> {
    return this.http.get<ItemInventario[]>(`${this.apiUrl}/${id}/items`, { headers: this.getAuthHeaders() });
  }
}
