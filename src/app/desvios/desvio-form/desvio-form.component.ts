import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { correlationIdFrom, parseApiError } from '../../models/api-error-response';
import { Organizacion } from '../../organizacion/models/organizacion.model';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { CondicionOperacionDesvio, IndiceGravedadDesvio, CONDICION_OPERACION_LABEL, INDICE_GRAVEDAD_LABEL } from '../models/desvio.model';
import { DesviosService } from '../services/desvios.service';
import { validateEvidenceFile } from '../utils/evidencia-file';
import { NotificationService } from '../../services/notification.service';

@Component({ selector: 'app-desvio-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule], templateUrl: './desvio-form.component.html', styleUrls: ['./desvio-form.component.css', './evidencias.component.css', './error-handling.component.css'] })
export class DesvioFormComponent implements OnInit {
  @ViewChild('errorSummary') private errorSummary?: ElementRef<HTMLElement>;
  organizaciones: Organizacion[] = [];
  files: File[] = [];
  saving = false;
  error = '';
  inlineError = false;
  correlationId: string | null = null;
  fieldErrorEntries: ReadonlyArray<readonly [string, string]> = [];
  readonly indicesGravedad: IndiceGravedadDesvio[] = ['MUY_LEVE', 'LEVE', 'MODERADO', 'GRAVE', 'CRITICO'];
  readonly condicionesOperacion: CondicionOperacionDesvio[] = ['NORMAL', 'ANORMAL', 'EMERGENCIA'];
  readonly gravedadLabels = INDICE_GRAVEDAD_LABEL;
  readonly condicionLabels = CONDICION_OPERACION_LABEL;
  form = this.fb.group({
    organizacionId: ['', Validators.required], fechaDeteccion: [new Date().toISOString().slice(0, 10), Validators.required],
    indiceGravedad: ['', Validators.required], condicionOperacion: ['', Validators.required],
    sitioEstablecimiento: ['', [Validators.required, Validators.maxLength(500)]], descripcion: ['', Validators.required],
    accionesInmediatas: this.fb.array([this.crearAccion()]), accionesCorrectivasSugeridas: this.fb.array([this.crearAccion()]),
    responsablesReferentes: ['']
  });

  constructor(private fb: FormBuilder, private orgService: OrganizacionService, private service: DesviosService,
    private router: Router, @Inject(PLATFORM_ID) private platformId: object, private notifications: NotificationService) {}

  private crearAccion(): FormGroup { return this.fb.group({ descripcion: ['', Validators.required], responsable: [''], fechaEjecucion: [''] }); }
  get accionesInmediatas(): FormArray { return this.form.controls.accionesInmediatas; }
  get accionesCorrectivas(): FormArray { return this.form.controls.accionesCorrectivasSugeridas; }
  agregarAccion(tipo: 'inmediata' | 'correctiva'): void { (tipo === 'inmediata' ? this.accionesInmediatas : this.accionesCorrectivas).insert(0, this.crearAccion()); }
  quitarAccion(tipo: 'inmediata' | 'correctiva', indice: number): void { const acciones = tipo === 'inmediata' ? this.accionesInmediatas : this.accionesCorrectivas; if (acciones.length > 1) acciones.removeAt(indice); }

  ngOnInit(): void {
    this.orgService.getOrganizacionesRepresentacionTecnica().subscribe({
      next: organizaciones => this.organizaciones = organizaciones.filter((organizacion: Organizacion) => organizacion.vigente !== false),
      error: () => { this.error = 'No se pudieron cargar las empresas con representación técnica vigentes.'; this.inlineError = true; }
    });
  }
  onOrganizacion(): void { const organizacion = this.organizaciones.find(item => item.id === Number(this.form.value.organizacionId)); if (organizacion && !this.form.value.sitioEstablecimiento) this.form.patchValue({ sitioEstablecimiento: organizacion.domicilioRealProyecto || '' }); }
  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement; const rejected: string[] = [];
    const accepted = Array.from(input.files || []).filter(file => { const validationError = validateEvidenceFile(file); if (validationError) rejected.push(`${file.name}: ${validationError}`); return !validationError; });
    this.error = rejected.join(' '); this.inlineError = rejected.length > 0; this.files.push(...accepted); input.value = '';
  }
  quitar(index: number): void { this.files.splice(index, 1); }

  guardar(): void {
    if (this.saving) return;
    this.clearPreviousApiErrors();
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error = 'Completá todos los campos obligatorios, incluidas las descripciones de las acciones inmediata y correctiva.'; this.inlineError = true; this.focusErrorSummary(); return; }
    this.saving = true;
    const raw = this.form.getRawValue(); const payload = { ...raw, organizacionId: Number(raw.organizacionId) };
    this.service.crear(payload).pipe(finalize(() => this.saving = false)).subscribe({
      next: desvio => {
        if (!this.files.length) { void this.router.navigate(['/desvios', desvio.id]); return; }
        forkJoin(this.files.map(file => this.service.subirEvidencia(desvio.id, file).pipe(map(() => null), catchError((uploadError: unknown) => of(`${file.name}: ${this.publicMessage(uploadError, 'no se pudo guardar.')}`))))).subscribe(results => {
          const errors = results.filter((result): result is string => result !== null);
          void this.router.navigate(['/desvios', desvio.id], errors.length ? { queryParams: { evidenciaError: `El desvío fue creado. No se guardaron estas evidencias: ${errors.join(' ')}` } } : undefined);
        });
      },
      error: (requestError: unknown) => this.handleCreateError(requestError)
    });
  }

  serverError(path: string): string | null { const value: unknown = this.controlForApiPath(path)?.getError('server'); return typeof value === 'string' ? value : null; }
  private handleCreateError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) { this.error = 'No se pudo crear el desvío.'; void this.notifications.error('No se pudo crear el desvío', this.error); return; }
    const details = parseApiError(error.error); this.correlationId = correlationIdFrom(error, details); const code = details?.code;
    const validationError = code === 'DESVIO_VALIDATION_ERROR' || (!code && error.status === 400 && !!details?.fieldErrors);
    if (validationError) this.applyFieldErrors(details?.fieldErrors);
    this.error = details?.message ?? this.fallbackMessage(error.status, code);
    this.inlineError = validationError;
    if (validationError) this.focusErrorSummary();
    else if (error.status !== 401) void this.notifications.error(this.errorTitle(error.status), this.error, this.correlationId);
  }
  private fallbackMessage(status: number, code?: string): string {
    if (status === 0) return 'No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.';
    if (code === 'ACCESS_DENIED' || status === 403) return 'No tenés permisos para crear desvíos.';
    if (status === 401) return 'Tu sesión no es válida o expiró. Iniciá sesión nuevamente.';
    if (status === 409) return 'No se pudo crear el desvío porque existe un conflicto con los datos.';
    if (status === 503) return 'El servicio no está disponible temporalmente. Intentá nuevamente más tarde.';
    if (status === 500) return 'Ocurrió un error interno al crear el desvío. Intentá nuevamente.';
    return 'No se pudo crear el desvío.';
  }
  private publicMessage(error: unknown, fallback: string): string { return error instanceof HttpErrorResponse ? parseApiError(error.error)?.message ?? fallback : fallback; }
  private errorTitle(status: number): string {
    if (status === 403) return 'Sin permisos';
    if (status === 409) return 'Conflicto al crear el desvío';
    if (status === 0) return 'Problema de conexión';
    if (status === 503) return 'Servicio no disponible';
    return 'No se pudo crear el desvío';
  }
  private applyFieldErrors(fieldErrors?: Readonly<Record<string, string>>): void {
    if (!fieldErrors) return; this.fieldErrorEntries = Object.entries(fieldErrors);
    this.fieldErrorEntries.forEach(([path, message]) => { const control = this.controlForApiPath(path); if (control) { control.setErrors({ ...control.errors, server: message }); control.markAsTouched(); } });
  }
  private controlForApiPath(path: string): AbstractControl | null { return this.form.get(path.replace(/\[(\d+)\]/g, '.$1')); }
  private clearPreviousApiErrors(): void { this.error = ''; this.inlineError = false; this.correlationId = null; this.fieldErrorEntries = []; this.clearServerErrors(this.form); }
  private clearServerErrors(control: AbstractControl): void {
    if (control.errors?.['server']) { const clientErrors = { ...control.errors }; delete clientErrors['server']; control.setErrors(Object.keys(clientErrors).length ? clientErrors : null); }
    if (control instanceof FormArray || control instanceof FormGroup) Object.values(control.controls).forEach(child => this.clearServerErrors(child));
  }
  private focusErrorSummary(): void { if (isPlatformBrowser(this.platformId)) setTimeout(() => this.errorSummary?.nativeElement.focus()); }
}
