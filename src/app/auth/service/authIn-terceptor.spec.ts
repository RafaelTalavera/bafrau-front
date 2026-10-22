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
    handler.handle.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const interceptor = new AuthInterceptor(storage, auth);
    interceptor.intercept(new HttpRequest('POST', '/api/desvios', null), handler).subscribe({ error: () => undefined });
    expect(auth.handleAuthenticationFailure).toHaveBeenCalledTimes(1);
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
