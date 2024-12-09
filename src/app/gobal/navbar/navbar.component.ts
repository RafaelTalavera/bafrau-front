import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';



@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  jwt_token!: string | null;
  isAdmin: boolean = false;

  constructor(
    private authService: AuthService,
     private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.jwt_token = localStorage.getItem('jwtToken');
      if (this.jwt_token) {
        const decodedToken: any = this.jwt_decode(this.jwt_token);
        this.isAdmin = decodedToken.role === 'ADMIN';
      }
    }
  }

  onSubmit(form: NgForm) {
    this.authService.login(form.value.username, form.value.password)
      .subscribe(
        (data: any) => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('jwtToken', data.jwt);
            this.jwt_token = data.jwt;
            const decodedToken: any = this.jwt_decode(this.jwt_token!);
            this.isAdmin = decodedToken.role === 'ADMIN';
          }
        },
        error => {
          console.error('Error al iniciar sesión:', error);
        }
      );
  }

  jwt_decode(token: string): any {
    return JSON.parse(atob(token.split('.')[1]));
  }

  logout(): void {
    this.authService.logout();
    this.jwt_token = null;
    this.isAdmin = false;
    this.router.navigate(['/home']); // Navega a la ruta 'home' después de cerrar sesión
  }
}