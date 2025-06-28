import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LocalStorageService } from './service/local-Storage-Service';
import { environment } from '../../environments/environment';
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
        if (response?.token) {
          this.setToken(response.token);
        } else {
          console.error('Token no encontrado en la respuesta:', response);
        }
      })
    );
  }

  private setToken(token: string): void {
    this.localStorageService.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    const t = this.localStorageService.getItem(this.tokenKey);
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
      return [];
    }

    try {
      const decoded: any = jwtDecode(token);
      const rol = decoded.role as string | undefined;
      return rol ? [rol] : [];
    } catch (e) {
      return [];
    }
  }
}
