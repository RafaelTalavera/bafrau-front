// src/app/legal/semaforo-requisitos/semaforo-requisitos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';               // ← para [(ngModel)]
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
  imports: [CommonModule, FormsModule, FooterComponent, NavComponent],
  templateUrl: './semaforo-requisitos.component.html',
  styleUrls: ['./semaforo-requisitos.component.css']
})
export class SemaforoRequisitosComponent implements OnInit {
  requisitos: RequisitoSemaforo[] = [];
  loading = false;

  // filtros
  filterNombre: string = '';
  filterRazon: string = '';

  constructor(private controlService: ControlService) {}

  ngOnInit(): void {
    this.loading = true;
    this.controlService.getControles().subscribe({
      next: controles => {
        const hoy = new Date();
        const lista = controles.flatMap(ctrl =>
          (ctrl.items || []).map((it: ItemControlDTO) => {
            const venc = new Date(it.vencimiento);
            const dias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000*60*60*24));
            const sem: 'green'|'yellow'|'red' = dias >= 100 ? 'green'
              : dias > 45      ? 'yellow'
                               : 'red';
            return {
              organizacionId: ctrl.organizacionId,
              organizacionRazonSocial: ctrl.organizacionRazonSocial,
              fechaControl: ctrl.fecha,
              vencimiento: it.vencimiento,
              observaciones: it.observaciones,
              nombre: it.nombre,
              juridiccion: it.juridiccion,
              observacionesDocumento: it.observacionesDocumento,
              dias, semaforo: sem
            } as RequisitoSemaforo;
          })
        );
        this.requisitos = lista.sort((a, b) => a.dias - b.dias);
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar requisitos:', err);
        this.loading = false;
      }
    });
  }

  /** Devuelve los requisitos según los filtros actuales */
  get requisitosFiltrados(): RequisitoSemaforo[] {
    return this.requisitos
      .filter(r =>
        r.nombre?.toLowerCase().includes(this.filterNombre.toLowerCase())
      )
      .filter(r =>
        r.organizacionRazonSocial
          ?.toLowerCase()
          .includes(this.filterRazon.toLowerCase())
      );
  }
}
