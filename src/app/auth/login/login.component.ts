import Swal from 'sweetalert2';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

declare var $: any;

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const jwt = localStorage.getItem('jwt_token');
    if (jwt) {
      this.router.navigate(['/menu']);
    }
  }

  onSubmit(form: NgForm): void {
    this.authService.login(form.value.username, form.value.password)
      .subscribe({
        next: (data: any) => {
          const token = data?.token ?? data?.jwt ?? this.authService.getToken();
          const activoDesdeResponse = this.authService.getActivoDesdeAuthResponse(data);
          const activoDesdeToken = this.authService.getActivoDesdeToken(token);
          const activoFinal = activoDesdeResponse ?? activoDesdeToken;

          if (activoFinal === false) {
            this.authService.logout();
            Swal.fire({
              icon: 'error',
              title: 'Acceso denegado',
              text: 'Tu usuario esta bloqueado.',
              confirmButtonText: 'Aceptar'
            });
            return;
          }

          if (!token) {
            Swal.fire({
              icon: 'error',
              title: 'Error de autenticacion',
              text: 'No se recibio token valido.',
              confirmButtonText: 'Aceptar'
            });
            return;
          }

          this.router.navigate(['/menu']).then(() => {
            ($('[data-widget="pushmenu"]') as any).PushMenu();
            ($('[data-widget="treeview"]') as any).Treeview();
          });
        },
        error: (error) => {
          if (error?.status === 403) {
            Swal.fire({
              icon: 'error',
              title: 'Acceso denegado',
              text: 'Tu usuario esta bloqueado.',
              confirmButtonText: 'Aceptar'
            });
            return;
          }

          Swal.fire({
            icon: 'error',
            title: 'Error de autenticacion',
            text: 'Usuario o contrasena incorrectos.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }
}
