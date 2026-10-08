import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { CONDICION_OPERACION_LABEL, DesvioDetalle, EstadoDesvio, ESTADO_LABEL, INDICE_GRAVEDAD_LABEL, porcentajeParaEstado, SeguimientoDesvio } from '../models/desvio.model';
import { DesviosService } from '../services/desvios.service';
import { fileSize, isImageEvidence, validateEvidenceFile } from '../utils/evidencia-file';

@Component({ selector: 'app-desvio-detail', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule], templateUrl: './desvio-detail.component.html', styleUrls: ['./desvio-detail.component.css', './evidencias.component.css'] })
export class DesvioDetailComponent implements OnInit {
  id!: number; desvio?: DesvioDetalle; files: File[] = []; saving = false; editSaving = false; detailSaving = false; error = ''; evidenciaError = ''; editing?: SeguimientoDesvio; editingDetail = false; readonly labels = ESTADO_LABEL;
  readonly gravedadLabels = INDICE_GRAVEDAD_LABEL; readonly condicionLabels = CONDICION_OPERACION_LABEL;
  readonly estados: EstadoDesvio[] = ['PERMANECE', 'EN_PROCESO', 'PRIMERA_OBSERVACION', 'FINALIZADO'];
  form = this.fb.group({ fecha: [new Date().toISOString().slice(0,10), Validators.required], comentario: ['', Validators.required], estado: ['EN_PROCESO' as EstadoDesvio, Validators.required], porcentaje: [50, [Validators.required, Validators.min(0), Validators.max(100)]] });
  editForm = this.fb.group({ fecha: ['', Validators.required], comentario: ['', Validators.required], estado: ['EN_PROCESO' as EstadoDesvio, Validators.required], porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]] });
  detailForm = this.fb.group({ fechaDeteccion: ['', Validators.required], indiceGravedad: ['', Validators.required], condicionOperacion: ['', Validators.required], sitioEstablecimiento: ['', [Validators.required, Validators.maxLength(500)]], descripcion: ['', Validators.required], accionesInmediatas: this.fb.array([]), accionesCorrectivasSugeridas: this.fb.array([]), responsablesReferentes: [''] });
  constructor(private route: ActivatedRoute, private fb: FormBuilder, private service: DesviosService) {}
  private crearAccion(accion?: { descripcion: string; responsable?: string; fechaEjecucion?: string }) { return this.fb.group({ descripcion: [accion?.descripcion || '', Validators.required], responsable: [accion?.responsable || ''], fechaEjecucion: [accion?.fechaEjecucion || ''] }); }
  get accionesInmediatas(): FormArray { return this.detailForm.controls.accionesInmediatas; }
  get accionesCorrectivas(): FormArray { return this.detailForm.controls.accionesCorrectivasSugeridas; }
  agregarAccionDetalle(tipo: 'inmediata' | 'correctiva'): void { (tipo === 'inmediata' ? this.accionesInmediatas : this.accionesCorrectivas).push(this.crearAccion()); }
  quitarAccionDetalle(tipo: 'inmediata' | 'correctiva', indice: number): void { const acciones = tipo === 'inmediata' ? this.accionesInmediatas : this.accionesCorrectivas; if (acciones.length > 1) acciones.removeAt(indice); }
  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.evidenciaError = this.route.snapshot.queryParamMap.get('evidenciaError') || '';
    this.form.controls.estado.valueChanges.subscribe(estado => {
      if (estado) this.form.controls.porcentaje.setValue(porcentajeParaEstado(estado), { emitEvent: false });
    });
    this.cargar();
  }
  cargar(): void { this.service.obtener(this.id).subscribe({ next: d => { this.desvio = d; this.form.patchValue({ estado: d.estado, porcentaje: porcentajeParaEstado(d.estado) }); }, error: () => this.error = 'No se pudo cargar el desvío.' }); }
  onFiles(e: Event): void {
    const input = e.target as HTMLInputElement;
    const rejected: string[] = [];
    const accepted = Array.from(input.files || []).filter(file => {
      const message = validateEvidenceFile(file);
      if (message) rejected.push(`${file.name}: ${message}`);
      return !message;
    });
    this.files.push(...accepted);
    this.error = rejected.join(' ');
    input.value = '';
  }
  quitarArchivo(indice: number): void { this.files.splice(indice, 1); }
  esImagen(tipoMime: string): boolean { return isImageEvidence(tipoMime); }
  tamanoArchivo(bytes: number): string { return fileSize(bytes); }
  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.saving = true; this.error = '';
    const values = this.form.getRawValue();
    const payload = { ...values, porcentaje: porcentajeParaEstado(values.estado as EstadoDesvio) };
    this.service.agregarSeguimiento(this.id, payload).pipe(switchMap(s => this.files.length ? forkJoin(this.files.map(f => this.service.subirEvidencia(this.id, f, s.id))) : of([]))).subscribe({ next: () => { this.files=[]; this.form.patchValue({ comentario: '' }); this.saving=false; this.cargar(); }, error: err => { this.error = err?.error?.message || 'No se pudo guardar el seguimiento.'; this.saving=false; } });
  }
  iniciarEdicion(seguimiento: SeguimientoDesvio): void {
    this.error = '';
    this.editing = seguimiento;
    this.editForm.setValue({ fecha: seguimiento.fecha, comentario: seguimiento.comentario, estado: seguimiento.estado, porcentaje: seguimiento.porcentaje });
  }
  cancelarEdicion(): void { this.editing = undefined; this.editForm.reset(); }
  guardarEdicion(): void {
    if (!this.editing) return;
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.editSaving = true; this.error = '';
    this.service.actualizarSeguimiento(this.id, this.editing.id, this.editForm.getRawValue()).subscribe({
      next: () => { this.editSaving = false; this.cancelarEdicion(); this.cargar(); },
      error: err => { this.error = err?.error?.message || 'No se pudo actualizar el seguimiento.'; this.editSaving = false; }
    });
  }
  iniciarEdicionDetalle(): void {
    const d = this.desvio; if (!d) return;
    this.error = ''; this.editingDetail = true;
    this.accionesInmediatas.clear(); this.accionesCorrectivas.clear();
    d.accionesInmediatas.forEach(a => this.accionesInmediatas.push(this.crearAccion(a)));
    d.accionesCorrectivasSugeridas.forEach(a => this.accionesCorrectivas.push(this.crearAccion(a)));
    if (!this.accionesInmediatas.length) this.accionesInmediatas.push(this.crearAccion());
    if (!this.accionesCorrectivas.length) this.accionesCorrectivas.push(this.crearAccion());
    this.detailForm.patchValue({ fechaDeteccion: d.fechaDeteccion, indiceGravedad: d.indiceGravedad || '', condicionOperacion: d.condicionOperacion || '', sitioEstablecimiento: d.sitioEstablecimiento, descripcion: d.descripcion, responsablesReferentes: d.responsablesReferentes || '' });
  }
  cancelarEdicionDetalle(): void { this.editingDetail = false; this.detailForm.reset(); }
  guardarEdicionDetalle(): void {
    if (this.detailForm.invalid) { this.detailForm.markAllAsTouched(); return; }
    this.detailSaving = true; this.error = '';
    this.service.actualizar(this.id, this.detailForm.getRawValue()).subscribe({ next: d => { this.desvio = d; this.detailSaving = false; this.cancelarEdicionDetalle(); }, error: err => { this.error = err?.error?.message || 'No se pudieron actualizar los datos del hallazgo.'; this.detailSaving = false; } });
  }
  porcentaje(estado: EstadoDesvio): number { return porcentajeParaEstado(estado); }
  estadoClass(e: EstadoDesvio): string { return e === 'FINALIZADO' ? 'success' : e === 'PERMANECE' ? 'danger' : e === 'EN_PROCESO' ? 'warning' : 'info'; }
}
