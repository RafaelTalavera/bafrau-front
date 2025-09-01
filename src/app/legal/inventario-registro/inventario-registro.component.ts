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

import { FooterComponent } from "../../gobal/footer/footer.component";
import { NavComponent } from "../../gobal/nav/nav.component";
import { FilterByJurisdiccionPipe } from "./filter-by-jurisdiccion.pipe";
import { SpinnerComponent } from "../../utils/spinner/spinner.component";

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

  // — Formulario de Control (funcionalidades originales) —
  controlForm: ControlDTO = {
    id: 0,
    organizacionId: 0,
    fecha: '',
    organizacionRazonSocial: '',
    items: []
  };

  organizaciones: OrganizacionDTO[] = [];      // para el <select> del form
  documentos: Documento[] = [];
  juridiccionesUnicas: string[] = [];
  editMode = false;
  currentControlId: number | null = null;

  // — Texto de filtro y lista base —
  filterRazon: string = '';
  organizacionesConControles: OrganizacionDTO[] = [];

  // — Elementos seleccionados para detalle —
  selectedOrganizacion: OrganizacionDTO | null = null;
  selectedItems: ItemControlDTO[] = [];

  // — Spinner de carga —
  loading = true;

  constructor(
    private controlService: ControlService,
    private organizacionService: OrganizacionService,
    private documentoService: DocumentoService,
  ) { }

  ngOnInit(): void {
    this.loading = true;

    // para el form (dropdown organizaciones)
    this.cargarOrganizaciones();

    // para la tabla de organizaciones con controles
    this.cargarOrganizacionesConControles();

    // para el form (dropdown documentos)
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

  /** GET /api/organizaciones para el select del form */
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

  /** GET /api/controles/organizaciones para la tabla principal */
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

  /** Lista filtrada según filterRazon */
  get filteredOrganizaciones(): OrganizacionDTO[] {
    if (!this.filterRazon.trim()) {
      return this.organizacionesConControles;
    }
    const query = this.filterRazon.toLowerCase();
    return this.organizacionesConControles.filter(org =>
      org.razonSocial.toLowerCase().includes(query)
    );
  }

  /** Al hacer click en "Ver detalles" */
/** Al hacer click en "Ver detalles" */
viewDetails(org: OrganizacionDTO): void {
  // 1) Mostrar el contenedor de detalle inmediatamente
  this.selectedOrganizacion = org;

  // 2) Cargar ítems de la organización
  this.controlService.getItemsPorOrganizacion(org.id!).subscribe({
    next: items => {
      this.selectedItems = items;

      // 3) Guardar el ID real del Control (si vino)
      if (items.length > 0 && items[0].controlId) {
        this.currentControlId = items[0].controlId;
      } else {
        this.currentControlId = null;
        console.warn('No llegó controlId en ninguno de los ítems');
      }

      // 4) Habilitar modo edición si aplica
      this.editMode = true;

      // 5) Asegurar visibilidad del detalle:
      //    scrolleo el contenedor al tope y compenso el alto del NAV fijo
      setTimeout(() => {
        const detail = document.querySelector('.detail-container') as HTMLElement | null;
        if (!detail) return;

        const scroller = document.querySelector('.content-wrapper') as HTMLElement | null;
        const nav = document.querySelector('app-nav') as HTMLElement | null;
        const navHeight = nav?.offsetHeight ?? 0;

        // Lleva el detalle al inicio visible del contenedor scrolleable
        detail.scrollIntoView({ block: 'start', inline: 'nearest' });

        // Compensa el NAV para que el <h3> no quede tapado
        if (scroller) {
          scroller.scrollBy({ top: -(navHeight + 12), left: 0, behavior: 'auto' });
        } else {
          window.scrollBy({ top: -(navHeight + 12), left: 0, behavior: 'auto' });
        }
      }, 0);
    },
    error: () => Swal.fire('Error', 'No se pudieron cargar los ítems.', 'error')
  });
}


  /** Volver a la lista principal */
  backToList(): void {
    this.selectedOrganizacion = null;
    this.selectedItems = [];
  }

  /** Agrega un nuevo ítem al formulario principal */
  addItem(): void {
    this.controlForm.items.push({
      id: 0,
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

  /** Elimina un ítem del formulario principal */
  removeItem(idx: number): void {
    this.controlForm.items.splice(idx, 1);
  }

  /** Sincroniza textarea de mails en formulario principal */
  onListMailChange(item: ItemControlDTO, value: string): void {
    item.listMail = value
      .split(/[\n,]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  /** Al cambiar jurisdicción en formulario principal */
  onJuridiccionChange(index: number): void {
    this.controlForm.items[index].documentoId = 0;
  }

  /** Al cambiar documento en formulario principal */
  onDocumentoChange(index: number): void {
    // Lugar para cargar datos adicionales si se requiere
  }

  /** Crear o actualizar Control */
  onSubmit(): void {
    if (this.controlForm.items.length === 0) {
      Swal.fire('Error', 'Agregue al menos un requisito.', 'error');
      return;
    }

  const payload: ControlPayload = {
    organizacionId: this.controlForm.organizacionId,
    items: this.controlForm.items.map(i => ({
      id:                      i.id,            // ← id opcional
      documentoId:             i.documentoId,
      vencimiento:             i.vencimiento ?? '',
      presentacion:            i.presentacion ?? '',
      diasNotificacion:       i.diasNotificacion, 
      listMail:                [...i.listMail],
      observaciones:           i.observaciones ?? '',
      nombre:                  i.nombre,
      juridiccion:             i.juridiccion,
      observacionesDocumento:  i.observacionesDocumento ?? '',
      estado:                  i.estado
    }))
  };

  console.log('📤 Payload onSubmit:', payload);

    if (this.editMode && this.currentControlId != null) {
      this.controlService.updateControl(this.currentControlId, payload).subscribe({
        next: () => {
          Swal.fire('Actualizado', 'Control actualizado.', 'success');
          this.resetForm();
          this.cargarOrganizacionesConControles();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar.', 'error');
        }
      });
    } else {
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
  }

  /** Reinicia el formulario principal */
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

  /** Elimina un ítem de la vista de detalle */
removeDetalleItem(idx: number): void {
  const item = this.selectedItems[idx];
  if (item.id) {
    // solo si ya existía en BD
    this.controlService.deleteItem(item.id).subscribe({
      next: () => {
        this.selectedItems.splice(idx, 1);
        Swal.fire('Eliminado', 'Ítem borrado exitosamente.', 'success');
      },
      error: () => {
        Swal.fire('Error', 'No se pudo eliminar el ítem.', 'error');
      }
    });
  } else {
    // ítem nuevo que nunca se guardó
    this.selectedItems.splice(idx, 1);
  }
}


  /** Sincroniza textarea de mails en vista de detalle */
  onDetalleListMailChange(item: ItemControlDTO, value: string): void {
    item.listMail = value
      .split(/[\n,]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
  }

  /** Al cambiar jurisdicción en la vista de detalle */
  onDetalleJuridiccionChange(index: number): void {
    this.selectedItems[index].documentoId = 0;
  }

  /** Al cambiar documento en la vista de detalle */
  onDetalleDocumentoChange(index: number): void {
    // si requieres cargar datos adicionales al cambiar documento
  }


  /** Guardar cambios de ítems en la vista de detalle */
  onSubmitDetalle(): void {
    if (!this.selectedOrganizacion) { 
      return; 
    }

    // ← Usamos aquí el controlId real, no el ID de la organización
    const controlId = this.currentControlId!;
    const payload: ControlPayload = {
        organizacionId: this.selectedOrganizacion.id!, 
      items: this.selectedItems.map(i => ({
        id:                      i.id,
        documentoId:             i.documentoId,
        vencimiento:             i.vencimiento ?? '',
        presentacion:            i.presentacion ?? '',
        diasNotificacion:       i.diasNotificacion,  
        listMail:                [...i.listMail],
        observaciones:           i.observaciones ?? '',
        nombre:                  i.nombre,
        juridiccion:             i.juridiccion,
        observacionesDocumento:  i.observacionesDocumento ?? '',
        estado:                  i.estado
      }))
    };

    this.controlService.updateControl(controlId, payload).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Ítems actualizados correctamente.', 'success');
        this.backToList();
        this.cargarOrganizacionesConControles();
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
      }
    });
  }

  /** Detiene el spinner cuando todo está cargado */
  private checkIfLoadingCompleted(): void {
    if (
      this.organizaciones.length > 0 &&
      this.organizacionesConControles.length > 0 &&
      this.documentos.length > 0
    ) {
      this.loading = false;
    }
  }

  /** En InventarioRegistroComponent */
addDetalleItem(): void {
  this.selectedItems.push({
    id: null,
    documentoId: 0,
    controlId: this.currentControlId!,
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

}
