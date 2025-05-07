// src/app/legal/semaforo-requisitos/semaforo-requisitos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlService } from '../service/control.service';
import { ControlDTO, ItemControlDTO } from '../models/control.model';
import { FooterComponent } from "../../gobal/footer/footer.component";
import { NavComponent } from "../../gobal/nav/nav.component";

interface RequisitoSemaforo {
  organizacionId: number | null;
  fechaControl: string;
  vencimiento: string;
  observaciones: string | null;
  nombre: string | null;
  juridiccion: string | null;
  observacionesDocumento: string | null;
  organizacionRazonSocial: string | null;
  dias: number;
  semaforo: 'green' | 'yellow' | 'red';
}

@Component({
  selector: 'app-semaforo-requisitos',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent],
  templateUrl: './semaforo-requisitos.component.html',
  styleUrls: ['./semaforo-requisitos.component.css']
})
export class SemaforoRequisitosComponent implements OnInit {
  requisitos: RequisitoSemaforo[] = [];

  constructor(private controlService: ControlService) {}

  ngOnInit(): void {
    this.controlService.getControles().subscribe(controles => {
      const hoy = new Date();
      this.requisitos = controles.flatMap(ctrl =>
        (ctrl.items || []).map((it: ItemControlDTO) => {
          const venc = new Date(it.vencimiento);
          const diffMs = venc.getTime() - hoy.getTime();
          const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          // Declaración corregida para aceptar los tres valores
          let sem: 'green' | 'yellow' | 'red' = 'red';
          if (dias >= 100) sem = 'green';
          else if (dias > 45) sem = 'yellow';
          return {
            organizacionId: ctrl.organizacionId,
            organizacionRazonSocial: ctrl.organizacionRazonSocial,
            fechaControl: ctrl.fecha,
            vencimiento: it.vencimiento,
            observaciones: it.observaciones,
            nombre: it.nombre,
            juridiccion: it.juridiccion,
            observacionesDocumento: it.observacionesDocumento,
            dias,
            semaforo: sem
          } as RequisitoSemaforo;
        })
      );
    });
  }
}
