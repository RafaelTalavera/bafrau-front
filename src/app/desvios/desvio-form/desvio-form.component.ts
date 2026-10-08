import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { DesviosService } from '../services/desvios.service';
import { CondicionOperacionDesvio, IndiceGravedadDesvio, CONDICION_OPERACION_LABEL, INDICE_GRAVEDAD_LABEL } from '../models/desvio.model';
import { validateEvidenceFile } from '../utils/evidencia-file';

@Component({ selector: 'app-desvio-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule], templateUrl: './desvio-form.component.html', styleUrls: ['./desvio-form.component.css', './evidencias.component.css'] })
export class DesvioFormComponent implements OnInit {
  organizaciones: any[] = []; files: File[] = []; saving = false; error = '';
  readonly indicesGravedad: IndiceGravedadDesvio[] = ['MUY_LEVE', 'LEVE', 'MODERADO', 'GRAVE', 'CRITICO'];
  readonly condicionesOperacion: CondicionOperacionDesvio[] = ['NORMAL', 'ANORMAL', 'EMERGENCIA'];
  readonly gravedadLabels = INDICE_GRAVEDAD_LABEL;
  readonly condicionLabels = CONDICION_OPERACION_LABEL;
  form = this.fb.group({
    organizacionId: ['', Validators.required],
    fechaDeteccion: [new Date().toISOString().slice(0,10), Validators.required],
    indiceGravedad: ['', Validators.required],
    condicionOperacion: ['', Validators.required],
    sitioEstablecimiento: ['', [Validators.required, Validators.maxLength(500)]],
    descripcion: ['', Validators.required],
    accionesInmediatas: this.fb.array([this.crearAccion()]),
    accionesCorrectivasSugeridas: this.fb.array([this.crearAccion()]),
    responsablesReferentes: ['']
  });
  constructor(private fb: FormBuilder, private orgService: OrganizacionService, private service: DesviosService, private router: Router) {}
  private crearAccion() { return this.fb.group({ descripcion: ['', Validators.required], responsable: [''], fechaEjecucion: [''] }); }
  get accionesInmediatas(): FormArray { return this.form.controls.accionesInmediatas; }
  get accionesCorrectivas(): FormArray { return this.form.controls.accionesCorrectivasSugeridas; }
  agregarAccion(tipo: 'inmediata' | 'correctiva'): void {
    (tipo === 'inmediata' ? this.accionesInmediatas : this.accionesCorrectivas).insert(0, this.crearAccion());
  }
  quitarAccion(tipo: 'inmediata' | 'correctiva', indice: number): void {
    const acciones = tipo === 'inmediata' ? this.accionesInmediatas : this.accionesCorrectivas;
    if (acciones.length > 1) acciones.removeAt(indice);
  }
  ngOnInit(): void {
    this.orgService.getOrganizacionesRepresentacionTecnica().subscribe({
      next: organizaciones => this.organizaciones = organizaciones.filter(x => x.vigente !== false),
      error: () => this.error = 'No se pudieron cargar las empresas con representación técnica vigentes.'
    });
  }
  onOrganizacion(): void { const o = this.organizaciones.find(x => x.id === Number(this.form.value.organizacionId)); if (o && !this.form.value.sitioEstablecimiento) this.form.patchValue({ sitioEstablecimiento: o.domicilioRealProyecto || '' }); }
  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rejected: string[] = [];
    const accepted = Array.from(input.files || []).filter(file => {
      const error = validateEvidenceFile(file);
      if (error) rejected.push(`${file.name}: ${error}`);
      return !error;
    });
    this.error = rejected.join(' ');
    this.files.push(...accepted);
    input.value = '';
  }
  quitar(i: number): void { this.files.splice(i, 1); }
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Completá todos los campos obligatorios, incluidas las descripciones de las acciones inmediata y correctiva.';
      return;
    }
    this.saving = true; this.error = ''; const raw = this.form.getRawValue(); const payload = { ...raw, organizacionId: Number(raw.organizacionId) };
    this.service.crear(payload).subscribe({
      next: desvio => {
        if (!this.files.length) {
          this.router.navigate(['/desvios', desvio.id]);
          return;
        }
        forkJoin(this.files.map(file => this.service.subirEvidencia(desvio.id, file).pipe(
          map(() => null),
          catchError(err => of(`${file.name}: ${err?.error?.message || 'no se pudo guardar.'}`))
        ))).subscribe({
          next: results => {
            const errors = results.filter((result): result is string => result !== null);
            this.router.navigate(['/desvios', desvio.id], errors.length ? {
              queryParams: { evidenciaError: `El desvío fue creado. No se guardaron estas evidencias: ${errors.join(' ')}` }
            } : undefined);
          },
          error: err => this.router.navigate(['/desvios', desvio.id], {
            queryParams: {
              evidenciaError: err?.error?.message || 'El desvío fue creado, pero no se pudo guardar una evidencia.'
            }
          })
        });
      },
      error: err => {
        this.error = err?.error?.message || 'No se pudo crear el desvío.';
        this.saving = false;
      }
    });
  }
}
