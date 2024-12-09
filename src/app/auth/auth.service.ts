import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LocalStorageService } from './service/local-Storage-Service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://appbafrau-production.up.railway.app/api/auth/authenticate';
  private tokenKey = 'jwt_token';

  constructor(private http: HttpClient, private localStorageService: LocalStorageService) { }

  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };

    return this.http.post<any>(this.apiUrl, loginData).pipe(
      tap(response => {
        console.log('Respuesta del login:', response);
        if (response && response.token) {
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
    console.log('Token saved in localStorage:', this.localStorageService.getItem(this.tokenKey));
  }

  getToken(): string | null {
    const token = this.localStorageService.getItem(this.tokenKey);
    console.log('Getting token:', token);
    return token;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.localStorageService.removeItem(this.tokenKey);
  }
}
