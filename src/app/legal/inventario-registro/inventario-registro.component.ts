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

@Component({
  selector: 'app-inventario-registro',
  standalone: true,
  imports: [FormsModule, CommonModule, FooterComponent, NavComponent, FilterByJurisdiccionPipe],
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
  controles: ControlDTO[] = [];

  documentos: Documento[] = [];
  juridiccionesUnicas: string[] = [];

  editMode = false;
  currentControlId: number | null = null;

   filterRazon: string = '';

  constructor(
    private controlService: ControlService,
    private organizacionService: OrganizacionService,
    private documentoService: DocumentoService,
  ) {}

  ngOnInit(): void {
    this.cargarOrganizaciones();
    this.getControles();
    this.documentoService.findAll().subscribe({
      next: docs => {
        this.documentos = docs;
        this.juridiccionesUnicas = Array.from(new Set(docs.map(d => d.juridiccion)));
      },
      error: err => console.error('Error al cargar documentos', err)
    });
  }

   get filteredControles(): ControlDTO[] {
    if (!this.filterRazon) {
      return this.controles;
    }
    const term = this.filterRazon.toLowerCase();
    return this.controles.filter(c => {
      const org = this.organizaciones.find(o => o.id === c.organizacionId);
      return org?.razonSocial.toLowerCase().includes(term);
    });
  }

  cargarOrganizaciones(): void {
    this.organizacionService.getOrganizacionesRepresentacionTecnica()
      .subscribe(
        data => this.organizaciones = data.map(o => ({
          id: o.id!, razonSocial: o.razonSocial
        })),
        () => Swal.fire('Error', 'No se pudieron cargar organizaciones.', 'error')
      );
  }

  getControles(): void {
    this.controlService.getControles()
      .subscribe(
        data => this.controles = data,
        () => Swal.fire('Error', 'No se pudieron cargar controles.', 'error')
      );
  }

  addItem(): void {
    this.controlForm.items.push({
      id: 0,
      documentoId: 0,
      controlId: this.controlForm.id,
      vencimiento: '',
      diasNotificacion: 60,
      listMail: [],
      observaciones: null,
      nombre: '',
      juridiccion: '',
      observacionesDocumento: ''
    });
  }

  removeItem(idx: number): void {
    this.controlForm.items.splice(idx, 1);
  }

  onListMailChange(item: ItemControlDTO, value: string): void {
    item.listMail = value.split(',').map(m => m.trim());
  }

  onJuridiccionChange(index: number): void {
    // Al cambiar la jurisdicción, resetear el documento de este ítem
    const item = this.controlForm.items[index];
    item.documentoId = 0;
  }

  onDocumentoChange(index: number): void {
    // Aquí podrías cargar datos adicionales si necesitas
  }

  onSubmit(): void {
    if (!this.controlForm.fecha || this.controlForm.organizacionId === 0) {
      Swal.fire('Error', 'Complete fecha y organización.', 'error');
      return;
    }
    if (this.controlForm.items.length === 0) {
      Swal.fire('Error', 'Agregue al menos un requisito.', 'error');
      return;
    }

    const payload: ControlPayload = {
      fecha: this.controlForm.fecha,
      organizacionId: this.controlForm.organizacionId,
      items: this.controlForm.items.map(i => ({
        documentoId: i.documentoId,
        vencimiento: i.vencimiento,
        diasNotificacion: i.diasNotificacion,
        listMail: i.listMail,
        observaciones: i.observaciones ?? '',
        nombre: i.nombre,
        juridiccion: i.juridiccion,
        observacionesDocumento: i.observacionesDocumento ?? ''
      }))
    };

    if (this.editMode && this.currentControlId != null) {
      this.controlService.updateControl(this.currentControlId, payload)
        .subscribe(() => {
          Swal.fire('Actualizado', 'Control actualizado.', 'success');
          this.resetForm();
          this.getControles();
        }, () => Swal.fire('Error', 'No se pudo actualizar.', 'error'));
    } else {
      this.controlService.createControl(payload)
        .subscribe(() => {
          Swal.fire('Creado', 'Control creado.', 'success');
          this.resetForm();
          this.getControles();
        }, () => Swal.fire('Error', 'No se pudo crear.', 'error'));
    }
  }

  edit(control: ControlDTO): void {
    this.editMode = true;
    this.currentControlId = control.id;
    this.controlForm = {
      id: control.id,
      fecha: control.fecha,
      organizacionId: control.organizacionId,
      organizacionRazonSocial: control.organizacionRazonSocial,
      items: control.items.map(i => ({ ...i }))
    };
  }

  delete(controlId: number): void {
    Swal.fire({
      title: 'Confirmar eliminación',
      text: '¿Eliminar este control?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then(res => {
      if (res.isConfirmed) {
        this.controlService.deleteControl(controlId)
          .subscribe(() => {
            Swal.fire('Eliminado', '', 'success');
            this.getControles();
          }, () => Swal.fire('Error', 'No se pudo eliminar.', 'error'));
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

  getRazonSocial(id: number): string {
    const org = this.organizaciones.find(o => o.id === id);
    return org ? org.razonSocial : '';
  }

  viewDetails(control: ControlDTO): void {
    const razon = this.getRazonSocial(control.organizacionId);
    const htmlItems = control.items
      .map(i => `
        <div style="text-align:left; margin-bottom:8px;">
          <strong>Nombre:</strong> ${i.nombre}<br>
          <strong>Jurisdicción:</strong> ${i.juridiccion}<br>
          <strong>Vencimiento:</strong> ${i.vencimiento}<br>
           <strong>Aviso:</strong> ${i.diasNotificacion}<br>
          <strong>Mails:</strong> ${i.listMail.join(', ')}<br>
          <strong>Observaciones:</strong> ${i.observaciones ?? '–'}<br>
        </div>
      `).join('');

    Swal.fire({
      title: `Control – ${razon} – Ítems (${control.items.length})`,
      html: htmlItems,
      width: 700
    });
  }

}
