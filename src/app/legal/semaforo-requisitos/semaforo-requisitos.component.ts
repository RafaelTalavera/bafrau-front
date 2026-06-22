// src/app/legal/semaforo-requisitos/semaforo-requisitos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ControlService } from '../service/control.service';
import { FooterComponent } from "../../gobal/footer/footer.component";
import { NavComponent } from "../../gobal/nav/nav.component";
import { SpinnerComponent } from '../../utils/spinner/spinner.component';
import Swal from 'sweetalert2';


interface RequisitoSemaforo {
  id: number;
  estado: boolean;
  organizacionRazonSocial: string | null;
  createdDate: string | null;
  lastModifiedDate: string | null;
  presentacion: string | null;
  vencimiento: string | null;
  diasNotificacion: number;
  observaciones: string | null;
  nombre: string | null;
  juridiccion: string | null;
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
  searchTerm: string = '';

  constructor(private controlService: ControlService) { }

  ngOnInit(): void {
    this.loading = true;

    this.controlService.getItems().subscribe({
      next: items => {
        const hoy = new Date();

        this.requisitos = items
          .map(it => {
            const dias = it.vencimiento
              ? Math.ceil(
                  (new Date(it.vencimiento).getTime() - hoy.getTime())
                  / (1000 * 60 * 60 * 24)
                )
              : 0;

            const umbral = it.diasNotificacion;
            let semaforo: 'green' | 'yellow' | 'red';
            if (dias <= umbral) {
              semaforo = 'red';
            } else if (dias <= umbral + 20) {
              semaforo = 'yellow';
            } else {
              semaforo = 'green';
            }

            return {
              id:               it.id,
              estado:           it.estado ?? false,
              organizacionRazonSocial: it.razonSocial ?? '–',
              createdDate:      it.createdDate,
              lastModifiedDate: it.lastModifiedDate,
              presentacion:     it.presentacion,
              vencimiento:      it.vencimiento,
              diasNotificacion: umbral,
              observaciones:    it.observaciones,
              nombre:           it.nombre,
              juridiccion:      it.juridiccion,
              dias,
              semaforo
            } as RequisitoSemaforo;
          })
          .sort((a, b) => a.dias - b.dias);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar los requisitos.', 'error');
      }
    });
  }

  get requisitosFiltrados(): RequisitoSemaforo[] {
    const filtro = this.normalizeSearchText(this.searchTerm);

    return this.requisitos
      .filter(r => r.estado)
      .filter(r => this.matchesSearch(r, filtro));
  }

  private matchesSearch(requisito: RequisitoSemaforo, filtro: string): boolean {
    if (!filtro) {
      return true;
    }

    const searchableContent = [
      requisito.nombre,
      requisito.organizacionRazonSocial,
      requisito.juridiccion,
      requisito.observaciones,
      requisito.presentacion,
      requisito.vencimiento
    ]
      .filter((value): value is string => !!value)
      .map(value => this.normalizeSearchText(value))
      .join(' ');

    return searchableContent.includes(filtro);
  }

  private normalizeSearchText(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
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
        this.controlService.toggleEstadoItem(r.id).subscribe({
          next: updated => r.estado = updated.estado!,
          error:    () => Swal.fire('Error', 'No se pudo cambiar el estado.', 'error')
        });
      }
    });
  }
}
