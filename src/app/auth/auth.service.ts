import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LocalStorageService } from './service/local-Storage-Service';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth/authenticate`;
  private tokenKey = 'jwt_token';
  private handlingAuthenticationFailure = false;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private router: Router,
    private notifications: NotificationService
  ) {}

  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };
    return this.http.post<any>(this.apiUrl, loginData).pipe(
      tap(response => {
        const token = response?.token ?? response?.jwt;
        if (token) {
          this.setToken(token);
          this.handlingAuthenticationFailure = false;
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

  getActivoDesdeAuthResponse(response: any): boolean | null {
    const activo = response?.activo ?? response?.usuario?.activo;
    if (typeof activo === 'boolean') {
      return activo;
    }
    return null;
  }

  getActivoDesdeToken(token: string | null): boolean | null {
    if (!token) {
      return null;
    }

    try {
      const decoded: any = jwtDecode(token);
      if (typeof decoded?.activo === 'boolean') {
        return decoded.activo;
      }
      return null;
    } catch {
      return null;
    }
  }
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.localStorageService.removeItem(this.tokenKey);
  }

  handleAuthenticationFailure(code?: string): void {
    if (this.handlingAuthenticationFailure) return;
    this.handlingAuthenticationFailure = true;
    this.logout();

    if (this.router.url === '/login') {
      this.navigateToLogin();
      return;
    }

    void this.notifications.sessionEnded(this.authenticationFailureMessage(code))
      .then(() => this.navigateToLogin()).catch(() => this.navigateToLogin());
  }

  private authenticationFailureMessage(code?: string): string {
    switch (code) {
      case 'TOKEN_EXPIRED':
        return 'Tu sesión venció. Iniciá sesión nuevamente para continuar.';
      case 'TOKEN_INVALID':
        return 'Tu sesión no es válida. Iniciá sesión nuevamente para continuar.';
      case 'USER_INACTIVE_OR_NOT_FOUND':
        return 'Tu usuario está inactivo o ya no está disponible. Volvé a iniciar sesión o contactá a un administrador.';
      case 'AUTHENTICATION_REQUIRED':
      default:
        return 'Necesitás iniciar sesión nuevamente para continuar.';
    }
  }

  private navigateToLogin(): void {
    void this.router.navigate(['/login']);
  }

  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }

    try {
      const decoded: any = jwtDecode(token);
      const rawRoles = decoded?.roles ?? decoded?.authorities ?? decoded?.role;
      const roles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];

      return roles
        .map(role => this.normalizeRole(role))
        .filter((role): role is string => !!role);
    } catch (e) {
      return [];
    }
  }

  private normalizeRole(role: unknown): string | null {
    if (typeof role !== 'string' || !role.trim()) {
      return null;
    }

    const normalized = role.trim().replace(/^ROLE_/, '').toUpperCase();

    if (normalized === 'ADMIN') {
      return 'ADMINISTRATOR';
    }

    return normalized;
  }
}
