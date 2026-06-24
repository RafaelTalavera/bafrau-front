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
  organizaciones: OrganizacionDTO[] = [];
  documentos: Documento[] = [];
  juridiccionesUnicas: string[] = [];

  filterRazon = '';
  selectedOrganizacion: OrganizacionDTO | null = null;
  selectedControls: ControlDTO[] = [];
  deletedItems: ItemControlDTO[] = [];

  loading = true;
  private pendingInitialLoads = 0;
  private nextDraftControlId = -1;

  constructor(
    private controlService: ControlService,
    private organizacionService: OrganizacionService,
    private documentoService: DocumentoService,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.pendingInitialLoads = 2;
    this.cargarOrganizaciones();

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
    this.organizacionService.getAllOrganizaciones()
      .subscribe({
        next: data => {
          this.organizaciones = data
            .filter(o => o.id != null && o.vigente !== false)
            .map(o => ({
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

  get filteredOrganizaciones(): OrganizacionDTO[] {
    if (!this.filterRazon.trim()) {
      return this.organizaciones;
    }

    const query = this.filterRazon.toLowerCase();
    return this.organizaciones.filter(org =>
      org.razonSocial.toLowerCase().includes(query)
    );
  }

  viewDetails(org: OrganizacionDTO): void {
    this.loading = true;
    this.selectedOrganizacion = org;
    this.selectedControls = [];
    this.deletedItems = [];

    this.loadOrganizationDetail(org.id!);
  }

  backToList(): void {
    this.selectedOrganizacion = null;
    this.selectedControls = [];
    this.deletedItems = [];
  }

  removeDetalleItem(controlIndex: number, itemIndex: number): void {
    const control = this.selectedControls[controlIndex];
    const item = control.items[itemIndex];

    if (item.id) {
      this.controlService.deleteItem(item.id).subscribe({
        next: () => {
          this.loadOrganizationDetail(this.selectedOrganizacion!.id!, 'Eliminado', 'Item dado de baja correctamente.');
        },
        error: () => {
          Swal.fire('Error', 'No se pudo eliminar el item.', 'error');
        }
      });
      return;
    }

    control.items.splice(itemIndex, 1);
  }

  restoreDeletedItem(itemId: number): void {
    if (!this.selectedOrganizacion) {
      return;
    }

    this.controlService.restoreItem(itemId).subscribe({
      next: () => {
        this.loadOrganizationDetail(this.selectedOrganizacion!.id!, 'Restaurado', 'Item restaurado correctamente.');
      },
      error: () => {
        Swal.fire('Error', 'No se pudo restaurar el item.', 'error');
      }
    });
  }

  onDetalleListMailChange(item: ItemControlDTO, value: string): void {
    item.listMail = value
      .split(/[\n,]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
  }

  onDetalleJuridiccionChange(controlIndex: number, itemIndex: number): void {
    this.selectedControls[controlIndex].items[itemIndex].documentoId = 0;
  }

  onDetalleDocumentoChange(_controlIndex: number, _itemIndex: number): void {
    // reservado para datos derivados del documento
  }

  saveDetalleItem(controlIndex: number, itemIndex: number): void {
    if (!this.selectedOrganizacion) {
      return;
    }

    const control = this.selectedControls[controlIndex];
    const item = control?.items[itemIndex];

    if (!control || !item) {
      return;
    }

    if (!item.documentoId || !item.juridiccion || !item.vencimiento || !item.presentacion) {
      Swal.fire('Error', 'Complete los datos obligatorios del requisito antes de guardar.', 'error');
      return;
    }

    if (!this.isPersistedControl(control)) {
      Swal.fire('Pendiente', 'Primero cree el registro y luego podrá guardar cada requisito por separado.', 'info');
      return;
    }

    const payload: ControlPayload = {
      organizacionId: this.selectedOrganizacion.id!,
      items: [this.toPayloadItem(item)]
    };

    this.controlService.updateControl(control.id, payload).subscribe({
      next: () => {
        this.loadOrganizationDetail(
          this.selectedOrganizacion!.id!,
          'Guardado',
          'El requisito se actualizó correctamente.'
        );
      },
      error: () => {
        Swal.fire('Error', 'No se pudo guardar el requisito.', 'error');
      }
    });
  }

  onSubmitDetalle(controlIndex: number): void {
    if (!this.selectedOrganizacion) {
      return;
    }

    const control = this.selectedControls[controlIndex];
    if (!control) {
      return;
    }

    if (control.items.length === 0) {
      Swal.fire('Error', 'Agregue al menos un requisito antes de guardar.', 'error');
      return;
    }

    const payload: ControlPayload = {
      organizacionId: this.selectedOrganizacion.id!,
      items: control.items.map(item => this.toPayloadItem(item))
    };

    const request$ = this.isPersistedControl(control)
      ? this.controlService.updateControl(control.id, payload)
      : this.controlService.createControl(payload);

    request$.subscribe({
      next: () => {
        this.loadOrganizationDetail(
          this.selectedOrganizacion!.id!,
          this.isPersistedControl(control) ? 'Guardado' : 'Creado',
          this.isPersistedControl(control)
            ? `Control ${control.id} actualizado correctamente.`
            : `Se creó un nuevo registro para ${this.selectedOrganizacion?.razonSocial}.`
        );
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

  addDetalleItem(controlIndex: number): void {
    const control = this.selectedControls[controlIndex];
    if (!control) {
      return;
    }

    control.items.push({
      id: null,
      documentoId: 0,
      controlId: control.id,
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

  addNewControlDraft(): void {
    if (!this.selectedOrganizacion) {
      return;
    }

    const draftExists = this.selectedControls.some(control => !this.isPersistedControl(control));
    if (draftExists) {
      Swal.fire('Pendiente', 'Ya hay un registro nuevo sin guardar para esta organización.', 'info');
      return;
    }

    this.selectedControls.unshift({
      id: this.nextDraftControlId--,
      organizacionId: this.selectedOrganizacion.id,
      fecha: '',
      organizacionRazonSocial: this.selectedOrganizacion.razonSocial,
      items: []
    });
  }

  isPersistedControl(control: ControlDTO): boolean {
    return control.id > 0;
  }

  private normalizeControl(control: ControlDTO): ControlDTO {
    return {
      ...control,
      items: (control.items ?? []).map(item => ({
        ...item,
        listMail: item.listMail ?? []
      }))
    };
  }

  private toPayloadItem(item: ItemControlDTO): ControlPayload['items'][number] {
    return {
      id: item.id,
      documentoId: item.documentoId,
      vencimiento: item.vencimiento ?? '',
      presentacion: item.presentacion ?? '',
      diasNotificacion: item.diasNotificacion,
      listMail: [...item.listMail],
      observaciones: item.observaciones ?? '',
      nombre: item.nombre,
      juridiccion: item.juridiccion,
      observacionesDocumento: item.observacionesDocumento ?? '',
      estado: item.estado
    };
  }

  private loadOrganizationDetail(orgId: number, successTitle?: string, successText?: string): void {
    this.controlService.getControlesPorOrganizacion(orgId).subscribe({
      next: controls => {
        this.selectedControls = controls.map(control => this.normalizeControl(control));

        this.controlService.getItemsEliminadosPorOrganizacion(orgId).subscribe({
          next: deletedItems => {
            this.deletedItems = deletedItems.map(item => ({
              ...item,
              listMail: item.listMail ?? []
            }));
            this.loading = false;

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

            if (successTitle && successText) {
              Swal.fire(successTitle, successText, 'success');
            }
          },
          error: () => {
            this.loading = false;
            Swal.fire('Error', 'No se pudieron cargar los items eliminados.', 'error');
          }
        });
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los controles.', 'error');
      }
    });
  }
}
