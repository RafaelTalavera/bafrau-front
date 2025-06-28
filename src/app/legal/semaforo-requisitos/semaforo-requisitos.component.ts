// src/app/legal/semaforo-requisitos/semaforo-requisitos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';               // ← para [(ngModel)]
import { ControlService } from '../service/control.service';
import { FooterComponent } from "../../gobal/footer/footer.component";
import { NavComponent } from "../../gobal/nav/nav.component";
import { SpinnerComponent } from '../../utils/spinner/spinner.component';
import Swal from 'sweetalert2';

interface RequisitoSemaforo {
  id: number;
  estado: boolean;
  organizacionId: number | null;
  fechaControl: string;
  presentacion: string;
  vencimiento: string;
  diasNotificacion: number;
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
  imports: [
    CommonModule,
    FormsModule,
    FooterComponent,
    NavComponent,
    SpinnerComponent
  ],

  templateUrl: './semaforo-requisitos.component.html',
  styleUrls: ['./semaforo-requisitos.component.css']
})
export class SemaforoRequisitosComponent implements OnInit {
  requisitos: RequisitoSemaforo[] = [];
  loading = false;
  // filtros
  filterNombre: string = '';
  filterRazon: string = '';

  constructor(private controlService: ControlService) { }

  ngOnInit(): void {
    this.loading = true;
    this.controlService.getControles().subscribe({
      next: controles => {
        const hoy = new Date();
        this.requisitos = controles.flatMap(ctrl =>
          (ctrl.items || []).map(it => {
            const venc = new Date(it.vencimiento);
            const dias = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            // Semáforo: <5 rojo, 5–10 amarillo, >10 verde
            let semaforo: 'red' | 'yellow' | 'green';
            if (dias < 5) {
              semaforo = 'red';
            } else if (dias <= 10) {
              semaforo = 'yellow';
            } else {
              semaforo = 'green';
            }
            return {
              id: it.id,
              estado: it.estado ?? false,
              organizacionId: ctrl.organizacionId,
              organizacionRazonSocial: ctrl.organizacionRazonSocial,
              fechaControl: ctrl.fecha,
              presentacion: it.presentacion,
              vencimiento: it.vencimiento,
              observaciones: it.observaciones,
              diasNotificacion: it.diasNotificacion,
              nombre: it.nombre,
              juridiccion: it.juridiccion,
              observacionesDocumento: it.observacionesDocumento,
              dias,
              semaforo
            } as RequisitoSemaforo;
          })
        ).sort((a, b) => a.dias - b.dias);
        this.loading = false;
      },
      error: _ => this.loading = false
    });
  }

  get requisitosFiltrados(): RequisitoSemaforo[] {
    return this.requisitos
      .filter(r => r.estado)                               // ← sólo abiertos
      .filter(r =>
        r.nombre?.toLowerCase().includes(this.filterNombre.toLowerCase())
      )
      .filter(r =>
        r.organizacionRazonSocial
          ?.toLowerCase()
          .includes(this.filterRazon.toLowerCase())
      );
  }

  toggleEstado(r: RequisitoSemaforo) {
    Swal.fire({
      title: '¿Estás seguro que querés cambiar el estado?',
      text: 'Si lo hacés, dejás de ver el registro en el semáforo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'No, mantener'
    }).then(result => {
      if (result.isConfirmed) {
        this.controlService.toggleEstadoItem(r.id)
          .subscribe({
            next: updated => {
              r.estado = updated.estado!;
            },
            error: () => {
              Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
            }
          });
      }
    });
  }

}
