import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatrizService } from '../service/matriz-service';
import { FactorService } from '../factores/services/factores.service';
import { AccionService } from '../acciones/services/acciones.service';

import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { Accion, Factor, ItemMatriz, Matriz } from '../models/matriz';

interface Stage {
  name: string;
  actions: string[];
  nuevaAccion: string;
}

interface FactorItem {
  medio: string;
  factor: string;
  componente: string;
  key: string;
  valuations: { [stageName: string]: { [action: string]: string } };
}

@Component({
  selector: 'app-matriz-causa-efecto-v1',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NavComponent,
    FooterComponent
  ],
  templateUrl: './matriz-causa-efecto-v1.component.html',
  styleUrls: ['./matriz-causa-efecto-v1.component.css']
})
export class MatrizCausaEfectoV1Component implements OnInit {
  informe = {
    fecha: '',
    organizacionId: null as number | null,
    direccion: '',
    rubro: '',
    razonSocial: ''
  };
  organizaciones: any[] = [];
  availableFactors: Factor[] = [];
  availableActions: Accion[] = [];

  defaultStages: string[] = [
    'Construcción',
    'Operación y mantenimiento',
    'Cierre',
    'Comunes'
  ];

  factors: FactorItem[] = [];
  stages: Stage[] = [];
  valoraciones = ['positivo', 'negativo', 'neutro'];

  nuevoMedio = '';
  nuevoFactor = '';
  nuevoComponente = '';
  nuevaEtapa = '';

  groupedFactors: { subsistema: string; factors: FactorItem[] }[] = [];

  constructor(
    private matrizService: MatrizService,
    private factorService: FactorService,
    private accionService: AccionService,
    private router: Router,
 
  ) {}

  ngOnInit() {
    this.factorService.findAll().subscribe(
      f => this.availableFactors = f,
      err => console.error('Error al obtener factores:', err)
    );
    this.accionService.findAll().subscribe(
      a => this.availableActions = a,
      err => console.error('Error al obtener acciones:', err)
    );
    this.obtenerOrganizaciones();
  }

  obtenerOrganizaciones() {
    this.matrizService.getOrganizacionesAuditoriaAmbiental().subscribe(
      o => this.organizaciones = o,
      err => console.error('Error al obtener organizaciones (Auditoría Ambiental):', err)
    );
  }

  setRazonSocial(id: number) {
    this.informe.organizacionId = id;
    const o = this.organizaciones.find(x => x.id === id);
    this.informe.razonSocial = o?.razonSocial || '';
  }

  getUniqueSubsistemas(): string[] {
    const medios = new Set<string>();
    this.availableFactors.forEach(f => medios.add(f.medio));
    return Array.from(medios).sort();
  }

  getFilteredFactorsBySubsistema(sub: string): string[] {
    const set = new Set<string>();
    this.availableFactors
      .filter(f => f.medio === sub)
      .forEach(f => set.add(f.factor));
    return Array.from(set).sort();
  }

  getFilteredComponentesByFactor(sub: string, fac: string): string[] {
    const set = new Set<string>();
    this.availableFactors
      .filter(f => f.medio === sub && f.factor === fac)
      .forEach(f => set.add(f.componente));
    return Array.from(set).sort();
  }

  updateGroupedFactors() {
    const groups: Record<string, FactorItem[]> = {};
    this.factors.forEach(fi => {
      groups[fi.medio] = groups[fi.medio] || [];
      groups[fi.medio].push(fi);
    });
    this.groupedFactors = Object.keys(groups)
      .sort()
      .map(sub => ({
        subsistema: sub,
        factors: groups[sub].sort((a, b) => a.factor.localeCompare(b.factor))
      }));
  }

  addFactor() {
    const medio = this.nuevoMedio.trim();
    const factor = this.nuevoFactor.trim();
    const comp = this.nuevoComponente.trim();
    if (!medio || !factor || !comp) {
      Swal.fire('Error', 'Debe seleccionar Subsistema, Factor y Componente', 'error');
      return;
    }
    const key = `${medio}|${factor}|${comp}`;
    if (this.factors.some(f => f.key === key)) {
      Swal.fire('Error', 'Selección repetida', 'error');
      return;
    }
    const item: FactorItem = { medio, factor, componente: comp, key, valuations: {} };
    this.stages.forEach(s => {
      item.valuations[s.name] = {};
      s.actions.forEach(a => item.valuations[s.name][a] = '');
    });
    this.factors.push(item);
    this.updateGroupedFactors();
    this.nuevoMedio = this.nuevoFactor = this.nuevoComponente = '';
  }

  eliminarFactor(fi: FactorItem) {
    this.factors = this.factors.filter(f => f.key !== fi.key);
    this.updateGroupedFactors();
  }

  addStage() {
    const name = this.nuevaEtapa.trim();
    if (!name || this.stages.some(s => s.name === name)) {
      Swal.fire('Error', 'Etapa inválida o repetida', 'error');
      return;
    }
    this.stages.push({ name, actions: [], nuevaAccion: '' });
    this.stages.sort((a, b) =>
      this.defaultStages.indexOf(a.name) - this.defaultStages.indexOf(b.name)
    );
    this.factors.forEach(f => f.valuations[name] = {});
    this.nuevaEtapa = '';
  }

  eliminarEtapa(s: Stage) {
    this.stages = this.stages.filter(x => x !== s);
    this.factors.forEach(f => delete f.valuations[s.name]);
  }

  addAction(s: Stage) {
    const act = s.nuevaAccion.trim();
    if (!act || s.actions.includes(act)) {
      Swal.fire('Error', 'Acción inválida o repetida', 'error');
      return;
    }
    s.actions.push(act);
    this.factors.forEach(f => f.valuations[s.name][act] = '');
    s.nuevaAccion = '';
  }

  eliminarAccion(s: Stage, act: string) {
    s.actions = s.actions.filter(a => a !== act);
    this.factors.forEach(f => delete f.valuations[s.name]?.[act]);
  }

  getValuationClass(v: string) {
    return v === 'negativo'
      ? 'negative-cell'
      : v === 'neutro'
      ? 'neutral-cell'
      : v === 'positivo'
      ? 'positive-cell'
      : '';
  }

  getStageClass(name: string) {
    const l = name.toLowerCase();
    if (l.includes('construcción')) return 'stage-construccion';
    if (l.includes('operación')) return 'stage-funcionamiento';
    if (l.includes('cierre')) return 'stage-abandono';
    if (l.includes('comunes')) return 'stage-comunes';
    return '';
  }

  getAccionId(name: string) {
    const a = this.availableActions.find(x =>
      x.tipo.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return a?.id || 0;
  }

  getFactorId(name: string) {
    const f = this.availableFactors.find(x =>
      x.factor.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return f?.id || 0;
  }

  resetForm() {
    this.informe = {
      fecha: '',
      organizacionId: null,
      direccion: '',
      rubro: '',
      razonSocial: ''
    };
    this.factors = [];
    this.stages = [];
    this.groupedFactors = [];
    this.nuevoMedio = this.nuevoFactor = this.nuevoComponente = this.nuevaEtapa = '';
  }

  onSubmit() {
    if (!this.informe.organizacionId) {
      Swal.fire('Error', 'Debes seleccionar una organización', 'error');
      return;
    }
    const payload: Matriz = {
      id: 0,
      fecha: this.informe.fecha,
      organizacionId: this.informe.organizacionId!,
      razonSocial: this.informe.razonSocial,
      direccion: this.informe.direccion,
      rubro: this.informe.rubro,
      items: [],
      informe: JSON.stringify(this.informe)
    };
    this.factors.forEach(fi =>
      this.stages.forEach(st =>
        st.actions.forEach(a => {
          const val = fi.valuations[st.name][a];
          if (!val) return;
          payload.items.push({
            id: 0,
            fechaAlta: this.informe.fecha,
            organizacionId: this.informe.organizacionId!,
            razonSocial: this.informe.razonSocial,
            etapa: st.name,
            naturaleza: val,
            intensidad: 0,
            extension: 0,
            momento: 0,
            persistencia: 0,
            reversibilidad: 0,
            sinergia: 0,
            acumulacion: 0,
            efecto: 0,
            periodicidad: 0,
            recuperacion: 0,
            uip: 0,
            accionId: this.getAccionId(a),
            factorId: this.getFactorId(fi.factor),
            matrizId: 0,
            factorMedio: fi.medio,
            factorFactor: fi.factor,
            factorComponente: fi.componente,
            accionTipo: a,
            magnitude: 0,
            importance: 0
          });
        })
      )
    );
    console.log('Payload enviado:', JSON.stringify(payload, null, 2));
    this.matrizService.createMatriz(payload).subscribe(
      () => Swal.fire('Éxito', 'Matriz guardada correctamente.', 'success'),
      () => Swal.fire('Error', 'No se pudo guardar la matriz.', 'error')
    );
  }

  getFilteredActions(stage: Stage) {
    return this.availableActions
      .map(a => a.tipo)
      .filter(t => !stage.actions.includes(t));
  }

  trackByAction(i: number, a: string) {
    return a;
  }
}
