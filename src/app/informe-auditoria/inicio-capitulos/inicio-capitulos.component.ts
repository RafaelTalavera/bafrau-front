import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { CaratulaComponent } from '../caratula/caratula.component';
import { Capitulo1Component } from '../capitulo-1/capitulo-1.component';
import { InformeService } from '../../form-inicial-cliente/service/informe-service';
import { Informe } from '../../models/informe.model';

@Component({
  selector: 'app-inicio-capitulos',
  standalone: true,
  templateUrl: './inicio-capitulos.component.html',
  styleUrls: ['./inicio-capitulos.component.css'],
  imports: [CommonModule, ReactiveFormsModule, NavComponent, CaratulaComponent, Capitulo1Component, FooterComponent],
})
export class InicioCapitulosComponent implements OnInit {
  informeId!: number;
  razonSocial: string = 'Razón Social no especificada';
  capitulos = ['Capítulo 1', 'Capítulo 2', 'Capítulo 3'];
  informeData: Informe | null = null;

  mostrarCaratula = false;
  mostrarCapitulo: number | null = null;
  mostrarBibliografia = false;
  mostrarAnexos = false;

  constructor(private route: ActivatedRoute, private router: Router, private informeService: InformeService) {}

  ngOnInit(): void {
    this.informeId = Number(this.route.snapshot.paramMap.get('informeId'));
    this.route.queryParams.subscribe(params => {
      this.razonSocial = params['razonSocial'] || this.razonSocial;
    });

    // Carga del Informe completo
    this.informeService.getInformeById(this.informeId).subscribe(
      (data: Informe) => {
        this.informeData = data;
      },
      error => {
        console.error('Error al cargar el informe:', error);
      }
    );
  }

  navegarACaratula(): void {
    this.mostrarCaratula = true;
    this.mostrarCapitulo = null;
  }

  navegarACapitulo(capitulo: string): void {
    this.resetDisplay();
    this.mostrarCapitulo = +capitulo.split(' ')[1];
  }

  navegarABibliografia(): void {
    this.resetDisplay();
    this.mostrarBibliografia = true;
  }

  navegarAAnexos(): void {
    this.resetDisplay();
    this.mostrarAnexos = true;
  }

  private resetDisplay(): void {
    this.mostrarCaratula = false;
    this.mostrarCapitulo = null;
    this.mostrarBibliografia = false;
    this.mostrarAnexos = false;
  }
}
