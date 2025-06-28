// src/app/auth/login/login.component.ts
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
  imports: [CommonModule, FormsModule],
})
export class LoginComponent implements OnInit {
  jwt_token!: string;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const jwt = localStorage.getItem('jwt_token');
    if (jwt) {
      this.router.navigate(['/menu']);
    }
  }

  onSubmit(form: NgForm) {
    this.authService.login(form.value.username, form.value.password)
      .subscribe(
        (data: any) => {
          if (data?.jwt) {
            localStorage.setItem('jwt_token', data.jwt);
            // Navega y luego inicializa AdminLTE
            this.router.navigate(['/menu']).then(() => {
              // Toggle sidebar
              ($('[data-widget="pushmenu"]') as any).PushMenu();
              // Inicializa submenús
              ($('[data-widget="treeview"]') as any).Treeview();
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error de autenticación',
              text: 'No se recibió token válido.',
              confirmButtonText: 'Aceptar'
            });
          }
        },
        error => {
          Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: 'Usuario o contraseña incorrectos.',
            confirmButtonText: 'Aceptar'
          });
        }
      );
  }
}
