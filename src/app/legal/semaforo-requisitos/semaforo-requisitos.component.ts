// src/app/legal/semaforo-requisitos/semaforo-requisitos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ControlService } from '../service/control.service';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';
import Swal from 'sweetalert2';

interface RequisitoSemaforo {
  id: number;
  controlId: number;
  organizacionId: number | null;
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

type SemaforoFilter = 'all' | 'red' | 'yellow' | 'green';

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
  searchTerm = '';
  semaforoFilter: SemaforoFilter = 'all';

  constructor(
    private controlService: ControlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.controlService.getItems().subscribe({
      next: items => {
        const hoy = new Date();

        this.requisitos = items
          .map(it => {
            const dias = it.vencimiento
              ? Math.ceil(
                  (new Date(it.vencimiento).getTime() - hoy.getTime()) /
                    (1000 * 60 * 60 * 24)
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
              id: it.id,
              controlId: it.controlId,
              organizacionId: it.organizacionId ?? null,
              estado: it.estado ?? false,
              organizacionRazonSocial: it.razonSocial ?? '-',
              createdDate: it.createdDate,
              lastModifiedDate: it.lastModifiedDate,
              presentacion: it.presentacion,
              vencimiento: it.vencimiento,
              diasNotificacion: umbral,
              observaciones: it.observaciones,
              nombre: it.nombre,
              juridiccion: it.juridiccion,
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
      .filter(r => this.semaforoFilter === 'all' || r.semaforo === this.semaforoFilter)
      .filter(r => this.matchesSearch(r, filtro));
  }

  get totalActivos(): number {
    return this.requisitos.filter(r => r.estado).length;
  }

  get totalRojos(): number {
    return this.requisitos.filter(r => r.estado && r.semaforo === 'red').length;
  }

  get totalAmarillos(): number {
    return this.requisitos.filter(r => r.estado && r.semaforo === 'yellow').length;
  }

  get totalVerdes(): number {
    return this.requisitos.filter(r => r.estado && r.semaforo === 'green').length;
  }

  get totalVencidos(): number {
    return this.requisitos.filter(r => r.estado && r.dias < 0).length;
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

  getSemaforoLabel(semaforo: RequisitoSemaforo['semaforo']): string {
    if (semaforo === 'red') {
      return 'Critico';
    }

    if (semaforo === 'yellow') {
      return 'En alerta';
    }

    return 'Controlado';
  }

  getDiasLabel(dias: number): string {
    if (dias < 0) {
      return `${Math.abs(dias)} dias vencido`;
    }

    if (dias === 0) {
      return 'Vence hoy';
    }

    if (dias === 1) {
      return '1 dia restante';
    }

    return `${dias} dias restantes`;
  }

  trackById(_: number, requisito: RequisitoSemaforo): number {
    return requisito.id;
  }

  setSemaforoFilter(filter: SemaforoFilter): void {
    this.semaforoFilter = filter;
  }

  isSemaforoFilterActive(filter: SemaforoFilter): boolean {
    return this.semaforoFilter === filter;
  }

  toggleEstado(r: RequisitoSemaforo) {
    Swal.fire({
      title: 'Estas seguro de cambiar el estado?',
      text: 'Si lo haces, el registro deja de verse en el tablero.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, cambiar',
      cancelButtonText: 'No, mantener'
    }).then(result => {
      if (result.isConfirmed) {
        this.controlService.toggleEstadoItem(r.id).subscribe({
          next: updated => (r.estado = updated.estado!),
          error: () => Swal.fire('Error', 'No se pudo cambiar el estado.', 'error')
        });
      }
    });
  }

  openRegistroInventario(requisito: RequisitoSemaforo): void {
    if (!requisito.organizacionId) {
      Swal.fire('Error', 'No se pudo identificar la organizacion del requisito.', 'error');
      return;
    }

    this.router.navigate(['/registro-inventario'], {
      queryParams: {
        orgId: requisito.organizacionId,
        controlId: requisito.controlId,
        itemId: requisito.id
      }
    });
  }
}
