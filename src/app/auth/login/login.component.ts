import Swal from 'sweetalert2';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule],
})
export class LoginComponent implements OnInit {
  jwt_token!: string;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    const jwt_token = localStorage.getItem('jwt_token');
    console.log('Token JWT encontrado en el almacenamiento local:', jwt_token);
    if (jwt_token) {
      console.log('Redirigiendo al usuario a la página de inicio...');
      this.router.navigate(['/usuarios']);
    } else {
      console.log('No se encontró ningún jwt_token JWT en el almacenamiento local.');
    }
  }

  onSubmit(form: NgForm) {
    console.log('Formulario enviado:', form.value);
    this.authService.login(form.value.username, form.value.password)
      .subscribe((data: any) => {
        console.log('Respuesta del login:', data);
        if (data && data.jwt) {
          localStorage.setItem('jwt_token', data.jwt);
          console.log('Token guardado en localStorage:', localStorage.getItem('jwt_token'));
          this.router.navigate(['/for-inicial-cliente']);
        } else {
          console.error('jwt_token no encontrado en la respuesta del login:', data);
        }
      }, error => {
        console.error('Error al iniciar sesión:', error);
        
        // Mostrar mensaje con SweetAlert2 en caso de error
        Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: 'Por favor, verifique el mail y la contraseña.',
          confirmButtonText: 'Aceptar'
        });
      });
  }
}
