// src/app/legal/inventario-registro/inventario-registro.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
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
import { CanComponentDeactivate } from '../../guards/pending-changes.guard';

type RequirementFilter = 'all' | 'active' | 'closed';

interface VisibleRequirementItem {
  item: ItemControlDTO;
  itemIndex: number;
  displayIndex: number;
}

interface VisibleControlView {
  control: ControlDTO;
  controlIndex: number;
  visibleItems: VisibleRequirementItem[];
}

interface RegistroInventarioTarget {
  orgId: number;
  controlId: number;
  itemId: number;
}

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
export class InventarioRegistroComponent implements OnInit, CanComponentDeactivate {
  organizaciones: OrganizacionDTO[] = [];
  documentos: Documento[] = [];
  juridiccionesUnicas: string[] = [];

  filterRazon = '';
  selectedOrganizacion: OrganizacionDTO | null = null;
  selectedControls: ControlDTO[] = [];
  deletedItems: ItemControlDTO[] = [];
  requirementFilter: RequirementFilter = 'all';
  visibleControlViews: VisibleControlView[] = [];
  highlightedItemId: number | null = null;

  loading = true;
  private nextDraftControlId = -1;
  private readonly requestTimeoutMs = 15000;
  private originalControlsSnapshot = '';
  private pendingNavigationTarget: RegistroInventarioTarget | null = null;

  constructor(
    private controlService: ControlService,
    private organizacionService: OrganizacionService,
    private documentoService: DocumentoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.hasPendingChanges()) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  }

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      organizaciones: this.organizacionService.getOrganizacionesRepresentacionTecnica().pipe(
        timeout(this.requestTimeoutMs),
        catchError(err => {
          console.error('Error al cargar organizaciones', err);
          Swal.fire('Error', 'No se pudieron cargar organizaciones.', 'error');
          return of([]);
        })
      ),
      documentos: this.documentoService.findAll().pipe(
        timeout(this.requestTimeoutMs),
        catchError(err => {
          console.error('Error al cargar documentos', err);
          Swal.fire('Error', 'No se pudieron cargar documentos.', 'error');
          return of([]);
        })
      )
    })
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe(({ organizaciones, documentos }) => {
        this.organizaciones = organizaciones
          .filter(o => o.id != null && o.vigente !== false)
          .map(o => ({
            id: o.id!,
            razonSocial: o.razonSocial,
            descripcion: o.descripcion ?? null
          }));

        this.documentos = documentos;
        this.juridiccionesUnicas = Array.from(new Set(documentos.map(d => d.juridiccion)));
        this.tryOpenTargetFromRoute();
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

  get activeRequirementsCount(): number {
    return this.selectedControls.reduce(
      (total, control) => total + (control.items?.filter(item => item.estado === true).length ?? 0),
      0
    );
  }

  get closedRequirementsCount(): number {
    return this.selectedControls.reduce(
      (total, control) => total + (control.items?.filter(item => item.estado !== true).length ?? 0),
      0
    );
  }

  private refreshVisibleControlViews(): void {
    let displayIndex = 0;

    this.visibleControlViews = this.selectedControls
      .map((control, controlIndex) => ({
        control,
        controlIndex,
        visibleItems: (control.items ?? [])
          .map((item, itemIndex) => ({ item, itemIndex }))
          .filter(({ item }) => this.matchesRequirementFilter(item))
          .map(({ item, itemIndex }) => ({
            item,
            itemIndex,
            displayIndex: ++displayIndex
          }))
      }))
      .filter(view => this.requirementFilter === 'all' || view.visibleItems.length > 0);
  }

  trackRequirementById(_: number, itemView: VisibleRequirementItem): number | null {
    return itemView.item.id;
  }

  get isFilteringRequirements(): boolean {
    return this.requirementFilter !== 'all';
  }

  get currentRequirementFilterLabel(): string {
    if (this.requirementFilter === 'active') {
      return 'activos';
    }

    if (this.requirementFilter === 'closed') {
      return 'cerrados';
    }

    return 'todos';
  }

  async viewDetails(org: OrganizacionDTO): Promise<void> {
    if (!(await this.confirmDiscardChanges())) {
      return;
    }

    this.loading = true;
    this.selectedOrganizacion = org;
    this.selectedControls = [];
    this.deletedItems = [];
    this.requirementFilter = 'all';
    this.visibleControlViews = [];
    this.originalControlsSnapshot = '';

    this.loadOrganizationDetail(org.id!);
  }

  async backToList(): Promise<void> {
    if (!(await this.confirmDiscardChanges())) {
      return;
    }

    this.selectedOrganizacion = null;
    this.selectedControls = [];
    this.deletedItems = [];
    this.requirementFilter = 'all';
    this.visibleControlViews = [];
    this.originalControlsSnapshot = '';
    this.highlightedItemId = null;
    this.pendingNavigationTarget = null;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  setRequirementFilter(filter: RequirementFilter): void {
    this.requirementFilter = this.requirementFilter === filter ? 'all' : filter;
    this.refreshVisibleControlViews();
  }

  isRequirementFilterSelected(filter: RequirementFilter): boolean {
    return this.requirementFilter === filter;
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
    this.refreshVisibleControlViews();
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
    const item = this.selectedControls[controlIndex].items[itemIndex];
    item.documentoId = 0;
    item.nombre = '';
    item.observacionesDocumento = '';
  }

  onDetalleDocumentoChange(controlIndex: number, itemIndex: number): void {
    const item = this.selectedControls[controlIndex].items[itemIndex];
    const documento = this.documentos.find(doc => doc.id === item.documentoId);
    if (!documento) {
      item.nombre = '';
      item.observacionesDocumento = '';
      return;
    }

    item.nombre = documento.nombre;
    item.juridiccion = documento.juridiccion;
    item.observacionesDocumento = documento.observaciones ?? '';
  }

  toggleDetalleEstado(item: ItemControlDTO): void {
    item.estado = !item.estado;
    this.refreshVisibleControlViews();
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

    this.hydrateItemFromSelectedDocument(item);

    const normalizedVencimiento = this.normalizeRequiredDate(item.vencimiento);
    if (!item.documentoId || !normalizedVencimiento) {
      Swal.fire('Error', 'Complete los datos obligatorios del requisito antes de guardar.', 'error');
      return;
    }

    item.vencimiento = normalizedVencimiento;
    item.presentacion = this.normalizeOptionalDate(item.presentacion);

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

    for (const item of control.items) {
      this.hydrateItemFromSelectedDocument(item);

      const normalizedVencimiento = this.normalizeRequiredDate(item.vencimiento);
      if (!item.documentoId || !normalizedVencimiento) {
        Swal.fire('Error', 'Complete los datos obligatorios del requisito antes de guardar.', 'error');
        return;
      }

      item.vencimiento = normalizedVencimiento;
      item.presentacion = this.normalizeOptionalDate(item.presentacion);
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
            ? 'Registro actualizado correctamente.'
            : `Los requisitos de ${this.selectedOrganizacion?.razonSocial} se guardaron correctamente.`
        );
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
      }
    });
  }

  addRequirement(): void {
    if (!this.selectedOrganizacion) {
      return;
    }

    this.requirementFilter = 'all';

    const draftIndex = this.selectedControls.findIndex(control => !this.isPersistedControl(control));
    if (draftIndex >= 0) {
      this.addDetalleItem(draftIndex);
      return;
    }

    if (this.selectedControls.length === 0) {
      this.addNewControlDraft();
      const newDraftIndex = this.selectedControls.findIndex(control => !this.isPersistedControl(control));
      this.addDetalleItem(newDraftIndex);
      return;
    }

    // Los controles se mantienen ordenados por fecha ascendente: el ultimo es el mas reciente.
    this.addDetalleItem(this.selectedControls.length - 1);
  }

  private addDetalleItem(controlIndex: number): void {
    const control = this.selectedControls[controlIndex];
    if (!control) {
      return;
    }

    control.items.push({
      id: null,
      documentoId: 0,
      controlId: control.id,
      vencimiento: '',
      presentacion: null,
      diasNotificacion: 60,
      listMail: [],
      observaciones: '',
      nombre: '',
      juridiccion: '',
      observacionesDocumento: '',
      estado: false
    });

    this.refreshVisibleControlViews();
  }

  private addNewControlDraft(): void {
    if (!this.selectedOrganizacion) {
      return;
    }

    const draftExists = this.selectedControls.some(control => !this.isPersistedControl(control));
    if (draftExists) {
      Swal.fire('Pendiente', 'Ya hay un registro nuevo sin guardar para esta organización.', 'info');
      return;
    }

    this.selectedControls.push({
      id: this.nextDraftControlId--,
      organizacionId: this.selectedOrganizacion.id,
      fecha: '',
      organizacionRazonSocial: this.selectedOrganizacion.razonSocial,
      items: []
    });

    this.sortSelectedControls();
    this.refreshVisibleControlViews();
  }

  isPersistedControl(control: ControlDTO): boolean {
    return control.id > 0;
  }

  canDeactivate(): boolean | Promise<boolean> {
    return this.confirmDiscardChanges();
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
      vencimiento: this.normalizeRequiredDate(item.vencimiento) ?? '',
      presentacion: this.normalizeOptionalDate(item.presentacion),
      diasNotificacion: item.diasNotificacion,
      listMail: [...item.listMail],
      observaciones: item.observaciones ?? '',
      nombre: item.nombre,
      juridiccion: item.juridiccion,
      observacionesDocumento: item.observacionesDocumento ?? '',
      estado: item.estado,
      deleted: item.deleted ?? false
    };
  }

  private hydrateItemFromSelectedDocument(item: ItemControlDTO): void {
    const documento = this.documentos.find(doc => doc.id === item.documentoId);
    if (!documento) {
      return;
    }

    item.nombre = documento.nombre;
    item.juridiccion = documento.juridiccion;
    item.observacionesDocumento = documento.observaciones ?? '';
  }

  private normalizeRequiredDate(value: string | null): string | null {
    return this.normalizeDateInput(value);
  }

  private normalizeOptionalDate(value: string | null): string | null {
    return this.normalizeDateInput(value);
  }

  private normalizeDateInput(value: string | null): string | null {
    if (value == null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const localMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    if (localMatch) {
      return `${localMatch[3]}-${localMatch[2]}-${localMatch[1]}`;
    }

    return null;
  }

  private sortSelectedControls(): void {
    this.selectedControls = [...this.selectedControls].sort((a, b) => {
      const timeA = this.parseControlDate(a.fecha);
      const timeB = this.parseControlDate(b.fecha);

      if (timeA === null && timeB === null) {
        return a.id - b.id;
      }

      if (timeA === null) {
        return 1;
      }

      if (timeB === null) {
        return -1;
      }

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return a.id - b.id;
    });
  }

  private parseControlDate(value: string | null | undefined): number | null {
    const normalized = this.normalizeDateInput(value ?? null);
    if (!normalized) {
      return null;
    }

    return new Date(`${normalized}T00:00:00`).getTime();
  }

  private matchesRequirementFilter(item: ItemControlDTO): boolean {
    if (this.requirementFilter === 'active') {
      return item.estado === true;
    }

    if (this.requirementFilter === 'closed') {
      return item.estado !== true;
    }

    return true;
  }

  private loadOrganizationDetail(orgId: number, successTitle?: string, successText?: string): void {
    forkJoin({
      controls: this.controlService.getControlesPorOrganizacion(orgId).pipe(
        timeout(this.requestTimeoutMs)
      ),
      deletedItems: this.controlService.getItemsEliminadosPorOrganizacion(orgId).pipe(
        timeout(this.requestTimeoutMs),
        catchError(err => {
          console.error('Error al cargar items eliminados', err);
          Swal.fire('Error', 'No se pudieron cargar los items eliminados.', 'error');
          return of([]);
        })
      )
    })
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: ({ controls, deletedItems }) => {
          this.selectedControls = (controls ?? []).map(control => this.normalizeControl(control));
          this.sortSelectedControls();
          this.requirementFilter = 'all';
          this.refreshVisibleControlViews();
          this.originalControlsSnapshot = this.createControlsSnapshot();

          this.deletedItems = (deletedItems ?? []).map(item => ({
            ...item,
            listMail: item.listMail ?? []
          }));

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

            this.focusPendingRequirement(orgId);
          }, 0);

          if (successTitle && successText) {
            Swal.fire(successTitle, successText, 'success');
          }
        },
        error: err => {
          console.error('Error al cargar controles', err);
          Swal.fire('Error', 'No se pudieron cargar los controles.', 'error');
        }
      });
  }

  private hasPendingChanges(): boolean {
    if (!this.selectedOrganizacion) {
      return false;
    }

    return this.originalControlsSnapshot !== this.createControlsSnapshot();
  }

  private async confirmDiscardChanges(): Promise<boolean> {
    if (!this.hasPendingChanges()) {
      return true;
    }

    const result = await Swal.fire({
      title: 'Cambios sin guardar',
      text: 'Hay cambios sin guardar. Queres salir de esta pantalla sin guardar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Salir sin guardar',
      cancelButtonText: 'Continuar editando',
      reverseButtons: true
    });

    return result.isConfirmed;
  }

  private createControlsSnapshot(): string {
    return JSON.stringify(
      this.selectedControls.map(control => ({
        id: control.id,
        organizacionId: control.organizacionId,
        fecha: control.fecha ?? '',
        items: (control.items ?? []).map(item => ({
          id: item.id,
          documentoId: item.documentoId,
          vencimiento: item.vencimiento ?? null,
          presentacion: item.presentacion ?? null,
          diasNotificacion: item.diasNotificacion,
          listMail: [...(item.listMail ?? [])],
          observaciones: item.observaciones ?? '',
          nombre: item.nombre ?? '',
          juridiccion: item.juridiccion ?? '',
          observacionesDocumento: item.observacionesDocumento ?? '',
          estado: item.estado,
          deleted: item.deleted ?? false
        }))
      }))
    );
  }

  private tryOpenTargetFromRoute(): void {
    const orgId = Number(this.route.snapshot.queryParamMap.get('orgId'));
    const controlId = Number(this.route.snapshot.queryParamMap.get('controlId'));
    const itemId = Number(this.route.snapshot.queryParamMap.get('itemId'));

    if (!Number.isInteger(orgId) || orgId <= 0 || !Number.isInteger(controlId) || controlId <= 0 || !Number.isInteger(itemId) || itemId <= 0) {
      return;
    }

    const org = this.organizaciones.find(organizacion => organizacion.id === orgId);
    if (!org) {
      Swal.fire('Error', 'No se encontro la organizacion asociada al requisito.', 'error');
      return;
    }

    this.pendingNavigationTarget = { orgId, controlId, itemId };
    void this.viewDetails(org);
  }

  private focusPendingRequirement(orgId: number): void {
    const target = this.pendingNavigationTarget;
    if (!target || target.orgId !== orgId) {
      return;
    }

    const targetExists = this.selectedControls.some(control =>
      control.id === target.controlId &&
      (control.items ?? []).some(item => item.id === target.itemId)
    );

    if (!targetExists) {
      this.pendingNavigationTarget = null;
      this.highlightedItemId = null;
      Swal.fire('Aviso', 'El requisito seleccionado no esta disponible para edicion.', 'info');
      return;
    }

    this.highlightedItemId = target.itemId;
    const targetElement = document.querySelector(`[data-item-id="${target.itemId}"]`) as HTMLElement | null;
    if (targetElement) {
      targetElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    this.pendingNavigationTarget = null;
  }
}
