import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LocalStorageService } from './service/local-Storage-Service';
import { environment } from '../../enviroments/enviroment';
import { jwtDecode } from 'jwt-decode';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth/authenticate`;
  private tokenKey = 'jwt_token';

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };
    return this.http.post<any>(this.apiUrl, loginData).pipe(
      tap(response => {
        console.log('Respuesta del login:', response);
        if (response?.token) {
          this.setToken(response.token);
        } else {
          console.error('Token no encontrado en la respuesta:', response);
        }
      })
    );
  }

  private setToken(token: string): void {
    console.log('Setting token:', token);
    this.localStorageService.setItem(this.tokenKey, token);
    console.log('Token saved in localStorage:', this.getToken());
  }

  getToken(): string | null {
    const t = this.localStorageService.getItem(this.tokenKey);
    console.log('[AuthService] getToken →', t);
    return t;
  }
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.localStorageService.removeItem(this.tokenKey);
  }

  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) {
      console.log('[AuthService] Sin token → roles=[]');
      return [];
    }

    try {
      const decoded: any = jwtDecode(token);
      console.log('[AuthService] payload decodificado →', decoded);
      const rol = decoded.role as string | undefined;
      console.log('[AuthService] rol extraído →', rol);
      return rol ? [rol] : [];
    } catch (e) {
      console.error('[AuthService] Error al decodificar JWT:', e);
      return [];
    }
  }
}
