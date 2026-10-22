import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { throwError } from 'rxjs';
import { AuthService } from '../auth.service';
import { AuthInterceptor } from './authIn-terceptor';
import { LocalStorageService } from './local-Storage-Service';

describe('AuthInterceptor', () => {
  it('delega un 401 al flujo central de sesión una sola vez por respuesta', () => {
    const storage = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['handleAuthenticationFailure']);
    const handler = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    handler.handle.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401, error: { code: 'TOKEN_EXPIRED' } })));
    const interceptor = new AuthInterceptor(storage, auth);
    interceptor.intercept(new HttpRequest('POST', '/api/desvios', null), handler).subscribe({ error: () => undefined });
    expect(auth.handleAuthenticationFailure).toHaveBeenCalledTimes(1);
    expect(auth.handleAuthenticationFailure).toHaveBeenCalledWith('TOKEN_EXPIRED');
  });

  it('no muestra una alerta de sesión por credenciales inválidas durante el login', () => {
    const storage = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['handleAuthenticationFailure']);
    const handler = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    handler.handle.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    new AuthInterceptor(storage, auth).intercept(new HttpRequest('POST', '/api/auth/authenticate', null), handler).subscribe({ error: () => undefined });
    expect(auth.handleAuthenticationFailure).not.toHaveBeenCalled();
  });

  it('no cierra la sesión ante un 403', () => {
    const storage = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['getItem']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['handleAuthenticationFailure']);
    const handler = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    handler.handle.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    new AuthInterceptor(storage, auth).intercept(new HttpRequest('POST', '/api/desvios', null), handler).subscribe({ error: () => undefined });
    expect(auth.handleAuthenticationFailure).not.toHaveBeenCalled();
  });
});
