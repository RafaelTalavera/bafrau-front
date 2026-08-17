import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { Organizacion } from '../../organizacion/models/organizacion.model';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';
import { MatrizCopiaResumen } from '../models/matriz';
import { MatrizService } from '../service/matriz-service';

interface OrganizacionOrigen {
  id: number;
  razonSocial: string;
  vigente: boolean;
}

@Component({
  selector: 'app-copiar-matriz',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './copiar-matriz.component.html',
  styleUrls: ['./copiar-matriz.component.css']
})
export class CopiarMatrizComponent implements OnInit {
  resumenes: MatrizCopiaResumen[] = [];
  organizacionesOrigen: OrganizacionOrigen[] = [];
  organizacionesDestino: Organizacion[] = [];
  organizacionOrigenId: number | null = null;
  matrizOrigenId: number | null = null;
  organizacionDestinoId: number | null = null;
  fecha = this.fechaLocalActual();
  loading = false;

  constructor(
    private matrizService: MatrizService,
    private organizacionService: OrganizacionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  get matricesOrigen(): MatrizCopiaResumen[] {
    return this.resumenes.filter(m => m.organizacionId === this.organizacionOrigenId);
  }

  get matrizSeleccionada(): MatrizCopiaResumen | undefined {
    return this.resumenes.find(m => m.matrizId === this.matrizOrigenId);
  }

  get destinosDisponibles(): Organizacion[] {
    return this.organizacionesDestino.filter(o => o.id !== this.organizacionOrigenId);
  }

  get destinoSeleccionado(): Organizacion | undefined {
    return this.organizacionesDestino.find(o => o.id === this.organizacionDestinoId);
  }

  get cantidadMatricesDestino(): number {
    return this.resumenes.filter(m => m.organizacionId === this.organizacionDestinoId).length;
  }

  seleccionarOrigen(): void {
    this.matrizOrigenId = null;
    if (this.organizacionDestinoId === this.organizacionOrigenId) {
      this.organizacionDestinoId = null;
    }
  }

  async confirmarCopia(): Promise<void> {
    const matriz = this.matrizSeleccionada;
    const destino = this.destinoSeleccionado;
    if (!matriz || !destino?.id || !this.fecha) {
      await Swal.fire('Datos incompletos', 'Selecciona origen, matriz, destino y fecha.', 'warning');
      return;
    }

    const advertenciaDestino = this.cantidadMatricesDestino > 0
      ? ` La organización destino ya tiene ${this.cantidadMatricesDestino} matriz/matrices; se creará una adicional.`
      : '';
    const result = await Swal.fire({
      title: 'Confirmar copia de matriz',
      text: `Origen: ${matriz.razonSocial}. Destino: ${destino.razonSocial}. Se copiarán ${matriz.cantidadItems} ítems.${advertenciaDestino} La copia será independiente y sus valoraciones deberán revisarse.`,
      icon: 'warning',
      input: 'checkbox',
      inputValue: 0,
      inputPlaceholder: 'Comprendo el alcance de la copia y revisaré sus valoraciones.',
      confirmButtonText: 'Copiar matriz',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      preConfirm: value => {
        if (!value) {
          Swal.showValidationMessage('Debes aceptar la advertencia para continuar.');
        }
        return value;
      }
    });

    if (!result.isConfirmed) return;
    this.ejecutarCopia(matriz.matrizId, destino.id);
  }

  private cargarDatos(): void {
    this.loading = true;
    forkJoin({
      matrices: this.matrizService.getMatricesDisponiblesParaCopia(),
      destinos: this.organizacionService.getOrganizacionesAuditoriaAmbiental()
    }).subscribe({
      next: ({ matrices, destinos }) => {
        this.resumenes = matrices;
        this.organizacionesDestino = destinos;
        const unicas = new Map<number, OrganizacionOrigen>();
        matrices.forEach(m => unicas.set(m.organizacionId, {
          id: m.organizacionId,
          razonSocial: m.razonSocial,
          vigente: m.organizacionVigente
        }));
        this.organizacionesOrigen = Array.from(unicas.values())
          .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los datos para copiar la matriz.', 'error');
      }
    });
  }

  private ejecutarCopia(matrizOrigenId: number, organizacionDestinoId: number): void {
    this.loading = true;
    this.matrizService.copiarMatriz(matrizOrigenId, { organizacionDestinoId, fecha: this.fecha }).subscribe({
      next: resultado => {
        this.loading = false;
        Swal.fire('Matriz copiada', `Se copiaron ${resultado.itemsCopiados} ítems.`, 'success')
          .then(() => this.router.navigate(['/matriz-causa-efecto-visualizacion'], {
            queryParams: { matrixId: resultado.matrizCreadaId, edit: true }
          }));
      },
      error: error => {
        this.loading = false;
        const mensaje = error?.error?.message || 'No se pudo copiar la matriz.';
        Swal.fire('Error', mensaje, 'error');
      }
    });
  }

  private fechaLocalActual(): string {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
}
