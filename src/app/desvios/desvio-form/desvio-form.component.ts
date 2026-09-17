import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { DesviosService } from '../services/desvios.service';
import { CondicionOperacionDesvio, IndiceGravedadDesvio, CONDICION_OPERACION_LABEL, INDICE_GRAVEDAD_LABEL } from '../models/desvio.model';

@Component({ selector: 'app-desvio-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule], templateUrl: './desvio-form.component.html', styleUrls: ['./desvio-form.component.css'] })
export class DesvioFormComponent implements OnInit {
  organizaciones: any[] = []; files: File[] = []; previews: string[] = []; saving = false; error = '';
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
    accionInmediata: ['', Validators.required],
    responsableAccionInmediata: [''],
    fechaEjecucionAccionInmediata: [''],
    accionCorrectivaSugerida: ['', Validators.required],
    responsableAccionCorrectiva: [''],
    fechaEjecucionAccionCorrectiva: [''],
    responsablesReferentes: ['']
  });
  constructor(private fb: FormBuilder, private orgService: OrganizacionService, private service: DesviosService, private router: Router) {}
  ngOnInit(): void {
    this.orgService.getOrganizacionesRepresentacionTecnica().subscribe({
      next: organizaciones => this.organizaciones = organizaciones.filter(x => x.vigente !== false),
      error: () => this.error = 'No se pudieron cargar las empresas con representación técnica vigentes.'
    });
  }
  onOrganizacion(): void { const o = this.organizaciones.find(x => x.id === Number(this.form.value.organizacionId)); if (o && !this.form.value.sitioEstablecimiento) this.form.patchValue({ sitioEstablecimiento: o.domicilioRealProyecto || '' }); }
  onFiles(event: Event): void { const input = event.target as HTMLInputElement; const selected = Array.from(input.files || []); this.files.push(...selected); selected.forEach(f => { const r = new FileReader(); r.onload = () => this.previews.push(String(r.result)); r.readAsDataURL(f); }); input.value = ''; }
  quitar(i: number): void { this.files.splice(i,1); this.previews.splice(i,1); }
  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = ''; const raw = this.form.getRawValue(); const payload = { ...raw, organizacionId: Number(raw.organizacionId) };
    this.service.crear(payload).subscribe({
      next: desvio => {
        if (!this.files.length) {
          this.router.navigate(['/desvios', desvio.id]);
          return;
        }
        forkJoin(this.files.map(file => this.service.subirEvidencia(desvio.id, file))).subscribe({
          next: () => this.router.navigate(['/desvios', desvio.id]),
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
