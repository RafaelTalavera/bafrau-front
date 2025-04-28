import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Organizacion } from '../../organizacion/models/organizacion.model';

@Component({
  selector: 'app-capitulo-1',
  standalone: true,
  templateUrl: './capitulo-1.component.html',
  styleUrls: ['./capitulo-1.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class Capitulo1Component implements OnInit {
  @Input() informeData!: Organizacion;

  capitulo1Form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Como *ngIf se asegura que informeData no es null, ya puedo usarla directamente
    this.capitulo1Form = this.fb.group({
      razonSocial: [this.informeData.razonSocial],
      nombreDelProponente: [this.informeData.nombreDelProponente],
      apoderadoLegal: [this.informeData.apoderadoLegal],
      cuit: [this.informeData.cuit],
      domicilioRealProyecto: [this.informeData.domicilioRealProyecto],
      domicilioLegalProyecto: [this.informeData.domicilioLegalProyecto],
      actividadPrincipal: [this.informeData.actividadPrincipal],
    });
  }
}
