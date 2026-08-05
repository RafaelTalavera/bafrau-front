import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  jwt_token!: string | null;
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.jwt_token = this.authService.getToken();
    if (this.jwt_token) {
      const decodedToken: any = this.jwt_decode(this.jwt_token);
      this.isAdmin = decodedToken.role === 'ADMIN' || decodedToken.role === 'ADMINISTRATOR';
    }
  }

  onSubmit(form: NgForm): void {
    this.authService.login(form.value.username, form.value.password).subscribe(
      (data: any) => {
        if (!isPlatformBrowser(this.platformId)) {
          return;
        }

        this.jwt_token = data?.token ?? data?.jwt ?? this.authService.getToken();
        if (!this.jwt_token) {
          return;
        }

        const decodedToken: any = this.jwt_decode(this.jwt_token);
        this.isAdmin = decodedToken.role === 'ADMIN' || decodedToken.role === 'ADMINISTRATOR';
        this.router.navigate(['/menu']);
      },
      error => {
        console.error('Error al iniciar sesion:', error);
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
    this.router.navigate(['/login']);
  }
}
