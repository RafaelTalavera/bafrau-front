
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
import { Matriz, ItemMatriz } from '../models/matriz';
import { Factor } from '../models/factor';
import { Accion } from '../models/accion';
import { Router } from '@angular/router';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';

import { MatrizBuilderUnifiedService } from '../service/matriz-builder-unified.service';

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
  providers: [MatrizService],
  imports: [CommonModule, FormsModule, HttpClientModule, NavComponent, FooterComponent],
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
  gridService2: any;

  constructor(
    private router: Router,
    private gridBuilder: MatrizBuilderUnifiedService,
    private organizacionService: OrganizacionService,
    private matrizService: MatrizService,
    private factorService: FactorService,
    private accionService: AccionService,
  ) { }

  ngOnInit() {
    this.factorService.findAll().subscribe(f => this.availableFactors = f);
    this.accionService.findAll().subscribe(a => this.availableActions = a);
    this.obtenerOrganizaciones();
  }


ngOnChanges(changes: SimpleChanges): void {
  if ((changes['matrix'] || changes['editMode']) && this.matrix && this.editMode) {
    // 1) Prefill del informe
    this.informe = {
      fecha: this.matrix.fecha,
      organizacionId: this.matrix.organizacionId,
      direccion: this.matrix.direccion,
      rubro: this.matrix.rubro,
      razonSocial: this.matrix.razonSocial
    };

    // 2) Mapear originalItemIds
    const origMap: Record<string, Record<string, Record<string, number>>> = {};
    this.matrix.items.forEach(item => {
      const key = [
        item.factorSistema,
        item.factorSubsistema,
        item.factorFactor,
        item.factorComponente || ''
      ].join('|');
      origMap[key] ||= {};
      origMap[key][item.etapa] ||= {};
      origMap[key][item.etapa][item.accionTipo] = item.id;
    });

    // 3) Llamada unificada
    const { factors, stages, valuationsMap, additionalMap } =
      this.gridBuilder.buildGrid(this.matrix.items);

    // 4) Crear mapa key→id
    const keyIdMap: Record<string, number> = {};
    factors.forEach(fv => {
      const key = [fv.sistema, fv.subsistema, fv.factor, fv.componente || ''].join('|');
      keyIdMap[key] = fv.id;
    });

    // 5) Construir this.factors
    this.factors = factors.map(fv => {
      const key = [fv.sistema, fv.subsistema, fv.factor, fv.componente || ''].join('|');
      return {
        sistema:        fv.sistema,
        subsistema:     fv.subsistema,
        factor:         fv.factor,
        componente:     fv.componente || '',
        key,
        valuations:     {} as Record<string, Record<string, string>>,
        originalItemIds: origMap[key] || {},
        additional:     additionalMap[fv.id] || {}
      };
    });

    // 6) Construir this.stages
    this.stages = stages.map(s => ({
      name: s.name,
      actions: s.actions,
      nuevaAccion: ''
    }));

    // 7) Rellenar las valoraciones usando keyIdMap
    this.factors.forEach(fi => {
      const id = keyIdMap[fi.key];
      this.stages.forEach(st => {
        fi.valuations[st.name] = {};
        st.actions.forEach(act => {
          fi.valuations[st.name][act] =
            valuationsMap[id]?.[st.name]?.[act] || '';
        });
      });
    });

    // 8) Agrupar factores para la vista
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

getFactorId(fi: FactorItem): number {
  const f = this.availableFactors.find(
    x =>
      x.sistema.trim()      === fi.sistema.trim() &&
      x.subsistema.trim()   === fi.subsistema.trim() &&
      x.factor.trim()       === fi.factor.trim() &&
      (x.componente || '').trim() === fi.componente.trim()
  );
  return f?.id ?? 0;
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

    console.log("📥 Items originales (matrix.items):", this.matrix.items);

  if (!this.informe.organizacionId) {
    Swal.fire('Error', 'Debes seleccionar una organización', 'error');
    return;
  }

  // aviso de carga
  Swal.fire({
    title: 'Cargando…',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => (Swal as any).showLoading()
  });

  // armo el payload
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
          const val = fi.valuations[st.name][a] || '';
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
            intensidad: 0, extension: 0, momento: 0,
            persistencia: 0, reversivilidad: 0,
            sinergia: 0, acumulacion: 0,
            efecto: 0, periodicidad: 0,
            recuperacion: 0, uip: 0,
            accionId: this.getAccionId(a),
            factorId: this.getFactorId(fi),
            matrizId: payload.id,
            factorSistema: fi.sistema,
            factorSubsistema: fi.subsistema,
            factorFactor: fi.factor,
            factorComponente: fi.componente,
            accionTipo: a,
            magnitude: 0, importance: 0
          });
        })
      )
    )
  );

  console.log("📤 Payload.items a enviar:", payload.items);
  
  // llamada HTTP
  const req$ = this.editMode
    ? this.matrizService.updateMatriz(payload.id, payload)  // <— dos args
    : this.matrizService.createMatriz(payload);

  req$.subscribe({
    next: () => {
      Swal.close();
      Swal.fire(
        'Éxito',
        this.editMode
          ? 'Matriz actualizada correctamente'
          : 'Matriz guardada correctamente',
        'success'
      ).then(() => {
        if (this.editMode) this.saved.emit(payload);
        else this.resetForm();
      });
    },
    error: () => {
      Swal.close();
      Swal.fire(
        'Error',
        this.editMode
          ? 'No se pudo actualizar la matriz'
          : 'No se pudo guardar la matriz',
        'error'
      );
    }
  });
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

  // al final de la clase MatrizCausaEfectoV1Component
shouldShowClasificacion(index: number): boolean {
  return index === 0 || this.factors[index].sistema !== this.factors[index - 1].sistema;
}

getRowSpan(index: number): number {
  let count = 1;
  const current = this.factors[index].sistema;
  for (let i = index + 1; i < this.factors.length; i++) {
    if (this.factors[i].sistema === current) count++;
    else break;
  }
  return count;
}

}
