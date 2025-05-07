
import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';

import { MatrizService } from '../service/matriz-service';
import { FactorService } from '../factores/services/factores.service';
import { AccionService } from '../acciones/services/acciones.service';
import { MatrizGridService, FactorView, Stage as GridStage } from '../service/matriz-grid.service';

import { Matriz, ItemMatriz } from '../models/matriz';
import { Factor } from '../models/factor';
import { Accion } from '../models/accion';
import { Router } from '@angular/router';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';

interface Stage {
  name: string;
  actions: string[];
  nuevaAccion: string;
}

interface FactorItem {
  sistema: string;
  subsistema: string;
  factor: string;
  componente: string;
  key: string;
  valuations: { [stageName: string]: { [action: string]: string } };
  originalItemIds: { [stageName: string]: { [action: string]: number } };
}

@Component({
  selector: 'app-matriz-causa-efecto-v1',
  standalone: true,
  providers: [ MatrizService ],  
  imports: [ CommonModule, FormsModule, HttpClientModule, NavComponent, FooterComponent ],
  templateUrl: './matriz-causa-efecto-v1.component.html',
  styleUrls: ['./matriz-causa-efecto-v1.component.css']
})
export class MatrizCausaEfectoV1Component implements OnInit, OnChanges {
  @Input() matrix!: Matriz;
  @Input() editMode = false;
  @Output() saved = new EventEmitter<Matriz>();

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

  defaultStages = [
    'Construcción',
    'Operación y mantenimiento',
    'Cierre',
    'Comunes'
  ];

  factors: FactorItem[] = [];
  stages: Stage[] = [];
  groupedFactors: { sistema: string; factors: FactorItem[] }[] = [];
  valoraciones = ['positivo', 'negativo', 'neutro'];

  nuevoSistema = '';
  nuevoSubsistema = '';
  nuevoFactor = '';
  nuevoComponente = '';
  nuevaEtapa = '';

  constructor(
    private router: Router, 
    private gridService: MatrizGridService,
    private organizacionService: OrganizacionService,
    private matrizService: MatrizService,
    private factorService: FactorService,
    private accionService: AccionService,
  ) {}

  ngOnInit() {
    this.factorService.findAll().subscribe(f => this.availableFactors = f);
    this.accionService.findAll().subscribe(a => this.availableActions = a);
    this.obtenerOrganizaciones();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['matrix'] && this.matrix && this.editMode) {
      // 1) Prefill del informe
      this.informe = {
        fecha: this.matrix.fecha,
        organizacionId: this.matrix.organizacionId,
        direccion: this.matrix.direccion,
        rubro: this.matrix.rubro,
        razonSocial: this.matrix.razonSocial
      };
      // 2) Construir grilla
      const { factors, stages, valuationsMap } = this.gridService.buildGrid(this.matrix.items);
      this.stages = stages.map(s => ({ ...s, nuevaAccion: '' }));

      // 3) Mapear originalItemIds
      const origMap: Record<string, Record<string, Record<string, number>>> = {};
      this.matrix.items.forEach(item => {
        const key = `${item.factorSistema}|${item.factorSubsistema}|${item.factorFactor}|${item.factorComponente}`;
        origMap[key] = origMap[key] || {};
        origMap[key][item.etapa] = origMap[key][item.etapa] || {};
        origMap[key][item.etapa][item.accionTipo] = item.id;
      });

      // 4) Construir factors incluyendo originalItemIds
      this.factors = factors.map(fv => ({
        sistema: fv.sistema,
        subsistema: fv.subsistema,
        factor: fv.factor,
        componente: fv.componente,
        key: fv.key,
        valuations: { ...valuationsMap[fv.key] },
        originalItemIds: origMap[fv.key] || {}
      }));

      this.updateGroupedFactors();
    }
  }

  obtenerOrganizaciones() {
    this.organizacionService.getOrganizacionesAuditoriaAmbiental().subscribe(
      o => this.organizaciones = o,
      err => console.error('Error al obtener organizaciones:', err)
    );
  }

  setRazonSocial(id: number) {
    this.informe.organizacionId = id;
    const o = this.organizaciones.find(x => x.id === id);
    this.informe.razonSocial = o?.razonSocial || '';
  }

  onSistemaChange(): void {
    this.nuevoSubsistema = '';
    this.nuevoFactor = '';
    this.nuevoComponente = '';
  }

  onSubsistemaChange(): void {
    this.nuevoFactor = '';
    this.nuevoComponente = '';
  }

  getUniqueSistemas(): string[] {
    return Array.from(new Set(this.availableFactors.map(f => f.sistema))).sort();
  }

  getUniqueSubsistemas(): string[] {
    if (!this.nuevoSistema) return [];
    return Array.from(new Set(
      this.availableFactors
        .filter(f => f.sistema === this.nuevoSistema)
        .map(f => f.subsistema)
    )).sort();
  }

  getFilteredFactorsBySubsistema(sub: string): string[] {
    if (!sub) return [];
    return Array.from(new Set(
      this.availableFactors
        .filter(f => f.sistema === this.nuevoSistema && f.subsistema === sub)
        .map(f => f.factor)
    )).sort();
  }

  getFilteredComponentesByFactor(fac: string): string[] {
    if (!fac) return [];
    return Array.from(new Set(
      this.availableFactors
        .filter(f => f.sistema === this.nuevoSistema && f.factor === fac)
        .map(f => f.componente)
    )).sort();
  }

  updateGroupedFactors() {
    const groups: Record<string, FactorItem[]> = {};
    this.factors.forEach(fi => {
      groups[fi.sistema] = groups[fi.sistema] || [];
      groups[fi.sistema].push(fi);
    });
    this.groupedFactors = Object.keys(groups)
      .sort()
      .map(sis => ({ sistema: sis, factors: groups[sis] }));
  }

  addFactor() {
    const sistema = this.nuevoSistema.trim();
    const subsistema = this.nuevoSubsistema.trim();
    const factor = this.nuevoFactor.trim();
    const comp = this.nuevoComponente.trim();
    if (!sistema || !subsistema || !factor || !comp) {
      Swal.fire('Error', 'Debe seleccionar Subsistema, Factor y Componente', 'error');
      return;
    }
    const key = `${sistema}|${subsistema}|${factor}|${comp}`;
    if (this.factors.some(f => f.key === key)) {
      Swal.fire('Error', 'Selección repetida', 'error');
      return;
    }
    const item: FactorItem = { 
      sistema, subsistema, factor, componente: comp, 
      key, valuations: {}, originalItemIds: {} 
    };
    this.stages.forEach(s => {
      item.valuations[s.name] = {};
      s.actions.forEach(a => item.valuations[s.name][a] = '');
    });
    this.factors.push(item);
    this.updateGroupedFactors();
    this.nuevoSistema = this.nuevoSubsistema = this.nuevoFactor = this.nuevoComponente = '';
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

  getAccionId(name: string) {
    const a = this.availableActions.find(
      x => x.tipo.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return a?.id || 0;
  }

  getFactorId(name: string) {
    const f = this.availableFactors.find(
      x => x.factor.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return f?.id || 0;
  }

  private resetForm(): void {
    // Salir de modo edición
    this.editMode = false;
    // Reiniciar datos del informe
    this.informe = {
      fecha: '',
      organizacionId: null,
      direccion: '',
      rubro: '',
      razonSocial: ''
    };
    // Restaurar etapas por defecto
    this.stages = this.defaultStages.map(name => ({ name, actions: [], nuevaAccion: '' }));
    // Limpiar factores y agrupación
    this.factors = [];
    this.updateGroupedFactors();
  }

  onSubmit() {
    if (!this.informe.organizacionId) {
      Swal.fire('Error', 'Debes seleccionar una organización', 'error');
      return;
    }
    const payload: Matriz = {
      id: this.editMode ? this.matrix.id : 0,
      fecha: this.informe.fecha,
      organizacionId: this.informe.organizacionId!,
      direccion: this.informe.direccion,
      rubro: this.informe.rubro,
      razonSocial: this.informe.razonSocial,
      items: [],
      informe: JSON.stringify(this.informe)
    };

    this.groupedFactors.forEach(group =>
      group.factors.forEach(fi =>
        this.stages.forEach(st =>
          st.actions.forEach(a => {
            const val = fi.valuations[st.name][a];
            if (!val) return;
            //  ✅ Aquí reutilizamos el ID original si existe
            const itemId = this.editMode 
              ? (fi.originalItemIds[st.name]?.[a] ?? 0) 
              : 0;
            payload.items.push({
              id: itemId,
              fechaAlta: this.informe.fecha,
              organizacionId: this.informe.organizacionId!,
              razonSocial: this.informe.razonSocial,
              etapa: st.name,
              naturaleza: val,
              intensidad: 0,
              extension: 0,
              momento: 0,
              persistencia: 0,
              reversivilidad: 0,
              sinergia: 0,
              acumulacion: 0,
              efecto: 0,
              periodicidad: 0,
              recuperacion: 0,
              uip: 0,
              accionId: this.getAccionId(a),
              factorId: this.getFactorId(fi.factor),
              matrizId: payload.id,
              factorSistema: fi.sistema,
              factorSubsistema: fi.subsistema,
              factorFactor: fi.factor,
              factorComponente: fi.componente,
              accionTipo: a,
              magnitude: 0,
              importance: 0
            });
          })
        )
      )
    );

    if (this.editMode) {
      this.saved.emit(payload);
    } else {
      this.matrizService.createMatriz(payload).subscribe(
        () => {
          Swal.fire('Éxito', 'Matriz guardada correctamente', 'success')
            .then(() => this.resetForm());  // <-- aquí recargas el formulario
        },
        () => Swal.fire('Error', 'No se pudo guardar la matriz', 'error')
      );
    }
  }

  getStageClass(name: string) {
    const l = name.toLowerCase();
    if (l.includes('construcción')) return 'stage-construccion';
    if (l.includes('operación')) return 'stage-funcionamiento';
    if (l.includes('cierre')) return 'stage-abandono';
    if (l.includes('comunes')) return 'stage-comunes';
    return '';
  }

  getFilteredActions(stage: Stage) {
    return this.availableActions
      .map(a => a.tipo)
      .filter(t => !stage.actions.includes(t));
  }

  trackByAction(i: number, a: string) {
    return a;
  }

  goToVisualizacion(): void {
    this.router.navigate(['/matriz-causa-efecto-visualizacion']);
  }
}
