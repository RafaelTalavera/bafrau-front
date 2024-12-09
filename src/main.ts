// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app-routing.module';
import { provideHttpClient } from '@angular/common/http'; // Importa solo provideHttpClient de @angular/common/http
import { HTTP_INTERCEPTORS } from '@angular/common/http'; // Importa HTTP_INTERCEPTORS de @angular/common/http
import { AuthInterceptor } from './app/auth/service/authIn-terceptor'; // Asegúrate de que la ruta del interceptor sea correcta

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // Provee el HttpClient sin configuraciones adicionales
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, // Configura el interceptor como multi: true
  ]
}).catch(err => console.error(err));
