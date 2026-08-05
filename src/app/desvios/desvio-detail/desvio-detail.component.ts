import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { DesvioDetalle, EstadoDesvio, ESTADO_LABEL } from '../models/desvio.model';
import { DesviosService } from '../services/desvios.service';

@Component({ selector: 'app-desvio-detail', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule], templateUrl: './desvio-detail.component.html', styleUrls: ['./desvio-detail.component.css'] })
export class DesvioDetailComponent implements OnInit {
  id!: number; desvio?: DesvioDetalle; files: File[] = []; saving = false; error = ''; evidenciaError = ''; readonly labels = ESTADO_LABEL;
  readonly estados: EstadoDesvio[] = ['PRIMERA_OBSERVACION','EN_PROCESO','PERMANECE','FINALIZADO'];
  form = this.fb.group({ fecha: [new Date().toISOString().slice(0,10), Validators.required], comentario: ['', Validators.required], estado: ['EN_PROCESO' as EstadoDesvio, Validators.required], porcentaje: [0, [Validators.required, Validators.min(0), Validators.max(100)]] });
  constructor(private route: ActivatedRoute, private fb: FormBuilder, private service: DesviosService) {}
  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.evidenciaError = this.route.snapshot.queryParamMap.get('evidenciaError') || '';
    this.cargar();
  }
  cargar(): void { this.service.obtener(this.id).subscribe({ next: d => { this.desvio = d; this.form.patchValue({ estado: d.estado, porcentaje: d.porcentaje }); }, error: () => this.error = 'No se pudo cargar el desvío.' }); }
  onFiles(e: Event): void { this.files = Array.from((e.target as HTMLInputElement).files || []); }
  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.saving = true; this.error = '';
    this.service.agregarSeguimiento(this.id, this.form.getRawValue()).pipe(switchMap(s => this.files.length ? forkJoin(this.files.map(f => this.service.subirEvidencia(this.id, f, s.id))) : of([]))).subscribe({ next: () => { this.files=[]; this.form.patchValue({ comentario: '' }); this.saving=false; this.cargar(); }, error: err => { this.error = err?.error?.message || 'No se pudo guardar el seguimiento.'; this.saving=false; } });
  }
  estadoClass(e: EstadoDesvio): string { return e === 'FINALIZADO' ? 'success' : e === 'PERMANECE' ? 'danger' : e === 'EN_PROCESO' ? 'warning' : 'info'; }
}
