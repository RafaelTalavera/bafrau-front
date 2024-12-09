import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';


@Component({
  selector: 'app-inicio-formulario-inicial',
  standalone: true,
  templateUrl: './inicio-formulario-inicial.component.html',
  styleUrls: ['./inicio-formulario-inicial.component.css'],
  imports: [CommonModule, FooterComponent, NavComponent],
})
export class InicioFormularioInicialComponent {
  constructor(private router: Router) {}

  navegarAFormulario(): void {
    this.router.navigate(['/form-informe']);
  }
}
