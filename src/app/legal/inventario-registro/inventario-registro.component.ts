// src/app/legal/inventario-registro/inventario-registro.component.ts

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import {
  ControlDTO,
  ControlPayload,
  ItemControlDTO,
  OrganizacionDTO
} from '../models/control.model';
import { ControlService } from '../service/control.service';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { DocumentoService } from '../service/documento.service';
import { Documento } from '../models/documento';

import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FilterByJurisdiccionPipe } from './filter-by-jurisdiccion.pipe';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';

@Component({
  selector: 'app-inventario-registro',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    FooterComponent,
    NavComponent,
    FilterByJurisdiccionPipe,
    SpinnerComponent
  ],
  templateUrl: './inventario-registro.component.html',
  styleUrls: ['./inventario-registro.component.css']
})
export class InventarioRegistroComponent implements OnInit {
  controlForm: ControlDTO = {
    id: 0,
    organizacionId: 0,
    fecha: '',
    organizacionRazonSocial: '',
    items: []
  };

  organizaciones: OrganizacionDTO[] = [];
  documentos: Documento[] = [];
  juridiccionesUnicas: string[] = [];
  editMode = false;
  currentControlId: number | null = null;

  filterRazon = '';
  organizacionesConControles: OrganizacionDTO[] = [];

  selectedOrganizacion: OrganizacionDTO | null = null;
  selectedItems: ItemControlDTO[] = [];
  selectedControlIds: number[] = [];

  loading = true;
  private pendingInitialLoads = 0;

  constructor(
    private controlService: ControlService,
    private organizacionService: OrganizacionService,
    private documentoService: DocumentoService,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.pendingInitialLoads = 3;
    this.cargarOrganizaciones();
    this.cargarOrganizacionesConControles();

    this.documentoService.findAll().subscribe({
      next: docs => {
        this.documentos = docs;
        this.juridiccionesUnicas = Array.from(new Set(docs.map(d => d.juridiccion)));
        this.checkIfLoadingCompleted();
      },
      error: err => {
        console.error('Error al cargar documentos', err);
        this.checkIfLoadingCompleted();
      }
    });
  }

  cargarOrganizaciones(): void {
    this.organizacionService.getOrganizacionesRepresentacionTecnica()
      .subscribe({
        next: data => {
          this.organizaciones = data.map(o => ({
            id: o.id!,
            razonSocial: o.razonSocial
          }));
          this.checkIfLoadingCompleted();
        },
        error: () => {
          Swal.fire('Error', 'No se pudieron cargar organizaciones.', 'error');
          this.checkIfLoadingCompleted();
        }
      });
  }

  cargarOrganizacionesConControles(): void {
    this.controlService.getOrganizaciones().subscribe({
      next: data => {
        this.organizacionesConControles = data.map(o => ({
          id: o.id!,
          razonSocial: o.razonSocial
        }));
        this.checkIfLoadingCompleted();
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las organizaciones con controles.', 'error');
        this.checkIfLoadingCompleted();
      }
    });
  }

  get filteredOrganizaciones(): OrganizacionDTO[] {
    if (!this.filterRazon.trim()) {
      return this.organizacionesConControles;
    }

    const query = this.filterRazon.toLowerCase();
    return this.organizacionesConControles.filter(org =>
      org.razonSocial.toLowerCase().includes(query)
    );
  }

  viewDetails(org: OrganizacionDTO): void {
    this.loading = true;
    this.selectedOrganizacion = org;
    this.currentControlId = null;
    this.selectedControlIds = [];

    this.controlService.getItemsPorOrganizacion(org.id!).subscribe({
      next: items => {
        this.selectedItems = items;

        const controlIds = Array.from(new Set(
          items
            .map(item => item.controlId)
            .filter((controlId): controlId is number => controlId != null)
        ));
        this.selectedControlIds = controlIds;

        if (controlIds.length === 1) {
          this.currentControlId = controlIds[0];
        } else {
          this.currentControlId = null;
          if (controlIds.length > 1) {
            Swal.fire(
              'Edicion bloqueada',
              'Esta organizacion tiene requisitos distribuidos en multiples controles. La edicion conjunta quedo bloqueada para evitar perdida de datos.',
              'warning'
            );
          } else {
            console.warn('No llego controlId en ninguno de los items');
          }
        }

        this.editMode = controlIds.length === 1;

        setTimeout(() => {
          const detail = document.querySelector('.detail-container') as HTMLElement | null;
          if (!detail) return;

          const scroller = document.querySelector('.content-wrapper') as HTMLElement | null;
          const nav = document.querySelector('app-nav') as HTMLElement | null;
          const navHeight = nav?.offsetHeight ?? 0;

          detail.scrollIntoView({ block: 'start', inline: 'nearest' });

          if (scroller) {
            scroller.scrollBy({ top: -(navHeight + 12), left: 0, behavior: 'auto' });
          } else {
            window.scrollBy({ top: -(navHeight + 12), left: 0, behavior: 'auto' });
          }
        }, 0);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los items.', 'error');
      }
    });
  }

  backToList(): void {
    this.selectedOrganizacion = null;
    this.selectedItems = [];
    this.selectedControlIds = [];
    this.currentControlId = null;
    this.editMode = false;
  }

  addItem(): void {
    this.controlForm.items.push({
      id: null,
      documentoId: 0,
      controlId: this.controlForm.id,
      vencimiento: '',
      presentacion: '',
      diasNotificacion: 60,
      listMail: [],
      observaciones: null,
      nombre: '',
      juridiccion: '',
      observacionesDocumento: '',
      estado: false
    });
  }

  removeItem(idx: number): void {
    this.controlForm.items.splice(idx, 1);
  }

  onListMailChange(item: ItemControlDTO, value: string): void {
    item.listMail = value
      .split(/[\n,]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  onJuridiccionChange(index: number): void {
    this.controlForm.items[index].documentoId = 0;
  }

  onDocumentoChange(index: number): void {
    // reservado para datos derivados del documento
  }

  onSubmit(): void {
    if (this.selectedOrganizacion) {
      Swal.fire('Error', 'No se puede usar el formulario principal mientras hay un detalle abierto.', 'error');
      return;
    }

    if (this.controlForm.items.length === 0) {
      Swal.fire('Error', 'Agregue al menos un requisito.', 'error');
      return;
    }

    const payload: ControlPayload = {
      organizacionId: this.controlForm.organizacionId,
      items: this.controlForm.items.map(i => ({
        id: i.id,
        documentoId: i.documentoId,
        vencimiento: i.vencimiento ?? '',
        presentacion: i.presentacion ?? '',
        diasNotificacion: i.diasNotificacion,
        listMail: [...i.listMail],
        observaciones: i.observaciones ?? '',
        nombre: i.nombre,
        juridiccion: i.juridiccion,
        observacionesDocumento: i.observacionesDocumento ?? '',
        estado: i.estado
      }))
    };

    this.controlService.createControl(payload).subscribe({
      next: () => {
        Swal.fire('Creado', 'Control creado.', 'success');
        this.resetForm();
        this.cargarOrganizacionesConControles();
      },
      error: () => {
        Swal.fire('Error', 'No se pudo crear.', 'error');
      }
    });
  }

  resetForm(): void {
    this.controlForm = {
      id: 0,
      organizacionId: 0,
      fecha: '',
      organizacionRazonSocial: '',
      items: []
    };
    this.editMode = false;
    this.currentControlId = null;
  }

  removeDetalleItem(idx: number): void {
    if (!this.editMode) {
      this.showBlockedEditWarning();
      return;
    }

    const item = this.selectedItems[idx];
    if (item.id) {
      this.controlService.deleteItem(item.id).subscribe({
        next: () => {
          this.selectedItems.splice(idx, 1);
          Swal.fire('Eliminado', 'Item borrado exitosamente.', 'success');
        },
        error: () => {
          Swal.fire('Error', 'No se pudo eliminar el item.', 'error');
        }
      });
    } else {
      this.selectedItems.splice(idx, 1);
    }
  }

  onDetalleListMailChange(item: ItemControlDTO, value: string): void {
    item.listMail = value
      .split(/[\n,]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
  }

  onDetalleJuridiccionChange(index: number): void {
    if (!this.editMode) {
      this.showBlockedEditWarning();
      return;
    }

    this.selectedItems[index].documentoId = 0;
  }

  onDetalleDocumentoChange(index: number): void {
    if (!this.editMode) {
      this.showBlockedEditWarning();
      return;
    }

    // reservado para datos derivados del documento
  }

  onSubmitDetalle(): void {
    if (!this.selectedOrganizacion) {
      return;
    }

    if (this.selectedControlIds.length !== 1 || this.currentControlId == null) {
      this.showBlockedEditWarning('error');
      return;
    }

    const payload: ControlPayload = {
      organizacionId: this.selectedOrganizacion.id!,
      items: this.selectedItems.map(i => ({
        id: i.id,
        documentoId: i.documentoId,
        vencimiento: i.vencimiento ?? '',
        presentacion: i.presentacion ?? '',
        diasNotificacion: i.diasNotificacion,
        listMail: [...i.listMail],
        observaciones: i.observaciones ?? '',
        nombre: i.nombre,
        juridiccion: i.juridiccion,
        observacionesDocumento: i.observacionesDocumento ?? '',
        estado: i.estado
      }))
    };

    this.controlService.updateControl(this.currentControlId, payload).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Items actualizados correctamente.', 'success');
        this.backToList();
        this.cargarOrganizacionesConControles();
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
      }
    });
  }

  private checkIfLoadingCompleted(): void {
    this.pendingInitialLoads = Math.max(0, this.pendingInitialLoads - 1);
    this.loading = this.pendingInitialLoads > 0;
  }

  addDetalleItem(): void {
    if (this.currentControlId == null) {
      this.showBlockedEditWarning();
      return;
    }

    this.selectedItems.push({
      id: null,
      documentoId: 0,
      controlId: this.currentControlId,
      vencimiento: '',
      presentacion: '',
      diasNotificacion: 60,
      listMail: [],
      observaciones: '',
      nombre: '',
      juridiccion: '',
      observacionesDocumento: '',
      estado: false
    });
  }

  private showBlockedEditWarning(icon: 'warning' | 'error' = 'warning'): void {
    Swal.fire(
      'Edicion bloqueada',
      'La organizacion tiene items asociados a multiples controles. Esta edicion se bloqueo para evitar borrar requisitos existentes.',
      icon
    );
  }
}
