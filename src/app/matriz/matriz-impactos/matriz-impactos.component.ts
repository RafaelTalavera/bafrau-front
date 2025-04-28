import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

import { ItemMatriz, Matriz } from '../models/matriz';
import { MatrizService } from '../service/matriz-service';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';

Chart.register(...registerables);

interface Stage {
  name: string;
  actions: string[];
}

export interface AdditionalFields {
  intensidad: number;
  extension: number;
  momento: number;
  persistencia: number;
  reversibilidad: number;
  sinergia: number;
  acumulacion: number;
  efecto: number;
  periodicidad: number;
  recuperacion: number;
  UIP: number;
}

interface FactorView {
  clasificacion: string;
  factor: string;
  key: string;
  factorComponente: string;  // Agregado
}

interface FactorSummary {
  factor: string;
  irt: number;
  actions: string[];
}

@Component({
  selector: 'app-matriz-impactos',
  standalone: true,
  imports: [ FormsModule, CommonModule, NavComponent, FooterComponent ],
  templateUrl: './matriz-impactos.component.html',
  styleUrls: ['./matriz-impactos.component.css']
})
export class MatrizImpactosComponent implements OnInit, AfterViewInit {
  matrices: Matriz[] = [];
  selectedMatrix: Matriz | null = null;
  showValoracionMatrix = false;

  factors: FactorView[] = [];
  stages: Stage[] = [];
  valuationsMap: { [key: string]: { [stage: string]: { [action: string]: string } } } = {};
  additionalMap: { [key: string]: { [stage: string]: { [action: string]: AdditionalFields } } } = {};

  organizationFilter = '';
  expandedFactors: { [key: string]: boolean } = {};

  intensidadOptions = [ /* ... */ ];
  extensionOptions = [ /* ... */ ];
  momentoOptions = [ /* ... */ ];
  persistenciaOptions = [ /* ... */ ];
  reversibilidadOptions = [ /* ... */ ];
  sinergiaOptions = [ /* ... */ ];
  acumulacionOptions = [ /* ... */ ];
  efectoOptions = [ /* ... */ ];
  periodicidadOptions = [ /* ... */ ];
  recuperacionOptions = [ /* ... */ ];

  topThreePosIRTs: FactorSummary[] = [];
  topThreeNegIRTs: FactorSummary[] = [];
  irtChart?: Chart;
  actionsChart?: Chart;

  @ViewChild('irtBarChart') irtBarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('irtActionsChart') irtActionsChartRef!: ElementRef<HTMLCanvasElement>;

  constructor(private matrizService: MatrizService) {}

  ngOnInit(): void {
    this.loadMatrices();
  }

  ngAfterViewInit(): void {}

  loadMatrices(): void {
    this.matrizService.getAllMatrices().subscribe(
      data => this.matrices = data,
      err => console.error('Error al cargar matrices:', err)
    );
  }

  get filteredMatrices(): Matriz[] {
    if (!this.organizationFilter.trim()) return this.matrices;
    return this.matrices.filter(m =>
      (m.razonSocial || '').toLowerCase().includes(this.organizationFilter.toLowerCase())
    );
  }

  viewDetails(matrix: Matriz): void {
    this.selectedMatrix = matrix;
    this.buildGrid(matrix);
  }

  backToList(): void {
    this.selectedMatrix = null;
    this.factors = [];
    this.stages = [];
    this.valuationsMap = {};
    this.additionalMap = {};
    this.expandedFactors = {};
    this.topThreePosIRTs = [];
    this.topThreeNegIRTs = [];
    this.irtChart?.destroy();
    this.actionsChart?.destroy();
  }

  private buildGrid(matriz: Matriz): void {
    this.factors = [];
    this.stages = [];
    this.valuationsMap = {};
    this.additionalMap = {};
    this.expandedFactors = {};

    const factorMap: { [key: string]: FactorView } = {};

    matriz.items.forEach(item => {
      if (!item.factorMedio || !item.etapa || !item.accionTipo) return;

      const clasificacion = item.factorMedio;
      const factorKey = `${clasificacion}|${item.factorFactor}`;
      const actionKey = item.accionTipo;

      if (!factorMap[factorKey]) {
        factorMap[factorKey] = {
          clasificacion,
          factor: item.factorComponente,
          key: factorKey,
          factorComponente: item.factorComponente  // Asignado
        };
        this.expandedFactors[factorKey] = false;
      }

      let stageObj = this.stages.find(s => s.name === item.etapa);
      if (!stageObj) {
        stageObj = { name: item.etapa, actions: [] };
        this.stages.push(stageObj);
      }
      if (!stageObj.actions.includes(actionKey)) {
        stageObj.actions.push(actionKey);
      }

      // Naturaleza
      this.valuationsMap[factorKey] = this.valuationsMap[factorKey] || {};
      this.valuationsMap[factorKey][item.etapa] = this.valuationsMap[factorKey][item.etapa] || {};
      this.valuationsMap[factorKey][item.etapa][actionKey] = item.naturaleza;

      // Adicionales
      this.additionalMap[factorKey] = this.additionalMap[factorKey] || {};
      this.additionalMap[factorKey][item.etapa] = this.additionalMap[factorKey][item.etapa] || {};
      const add: AdditionalFields = {
        intensidad: item.intensidad,
        extension: item.extension,
        momento: item.momento,
        persistencia: item.persistencia,
        reversibilidad: item.reversibilidad,
        sinergia: item.sinergia,
        acumulacion: item.acumulacion,
        efecto: item.efecto,
        periodicidad: item.periodicidad,
        recuperacion: item.recuperacion,
        UIP: item.uIP
      };
      this.additionalMap[factorKey][item.etapa][actionKey] = add;
    });

    this.factors = Object.values(factorMap)
      .sort((a, b) =>
        a.clasificacion.localeCompare(b.clasificacion) ||
        a.factor.localeCompare(b.factor)
      );
    this.stages.sort((a, b) => a.name.localeCompare(b.name));

    this.computeSummaryIRTs();
    setTimeout(() => {
      this.createBarChart();
      this.createBarChartActions();
    }, 100);
  }

  updateAdditionalValues(): void {
    if (!this.selectedMatrix?.id) return;

    this.factors.forEach(factor => {
      this.stages.forEach(stage => {
        stage.actions.forEach(actionKey => {
          const add = this.additionalMap[factor.key]?.[stage.name]?.[actionKey];
          if (add) {
            const item = this.selectedMatrix!.items.find(i =>
              `${i.factorMedio}|${i.factorComponente}` === factor.key &&
              i.etapa === stage.name &&
              i.accionTipo === actionKey
            );
            if (item) {
              item.intensidad = add.intensidad;
              item.extension = add.extension;
              item.momento = add.momento;
              item.persistencia = add.persistencia;
              item.reversibilidad = add.reversibilidad;
              item.sinergia = add.sinergia;
              item.acumulacion = add.acumulacion;
              item.efecto = add.efecto;
              item.periodicidad = add.periodicidad;
              item.recuperacion = add.recuperacion;
              item.uIP = add.UIP;
            }
          }
        });
      });
    });

    this.matrizService.updateMatriz(this.selectedMatrix.id, this.selectedMatrix).subscribe(
      () => Swal.fire('Actualizado', 'Valores adicionales actualizados correctamente.', 'success'),
      err => Swal.fire('Error', 'No se pudo actualizar los valores adicionales.', 'error')
    );
  }

  calculateImpact(factorKey: string, stage: string, action: string): number {
    const val = this.valuationsMap[factorKey]?.[stage]?.[action] || '';
    const sign = val.toLowerCase() === 'positivo' ? 1 : val.toLowerCase() === 'negativo' ? -1 : 0;
    const a = this.getAdditional(factorKey, stage, action);
    const total = 3*a.intensidad + 2*a.extension + a.momento + a.persistencia +
                  a.reversibilidad + a.sinergia + a.acumulacion +
                  a.efecto + a.periodicidad + a.recuperacion;
    return sign * total;
  }

  calculateImportanciaRelativaTotal(factorKey: string, stage: string, action: string): number {
    return this.calculateImpact(factorKey, stage, action) * (this.getAdditional(factorKey, stage, action).UIP / 1000);
  }

  calculateImportanciaAbsolutaTotal(factorKey: string): number {
    let sum = 0;
    this.stages.forEach(s => {
      if (this.valuationsMap[factorKey]?.[s.name]) {
        s.actions.forEach(action => {
          sum += this.calculateImpact(factorKey, s.name, action);
        });
      }
    });
    return sum;
  }

  calculateImportanciaRelativaTotalFactor(factorKey: string): number {
    return (this.calculateImportanciaAbsolutaTotal(factorKey) * this.getUIPValue(factorKey)) / 1000;
  }

  getAdditional(fk: string, stage: string, action: string): AdditionalFields {
    this.additionalMap[fk] = this.additionalMap[fk] || {};
    this.additionalMap[fk][stage] = this.additionalMap[fk][stage] || {};
    this.additionalMap[fk][stage][action] = this.additionalMap[fk][stage][action] || {
      intensidad: 0, extension: 0, momento: 0, persistencia: 0,
      reversibilidad: 0, sinergia: 0, acumulacion: 0, efecto: 0,
      periodicidad: 0, recuperacion: 0, UIP: 0
    };
    return this.additionalMap[fk][stage][action];
  }

  getUIPValue(fk: string): number {
    if (this.additionalMap[fk]) {
      for (const s in this.additionalMap[fk]) {
        for (const a in this.additionalMap[fk][s]) {
          return this.additionalMap[fk][s][a].UIP;
        }
      }
    }
    return 0;
  }

  getFactorActions(fk: string): string[] {
    const set = new Set<string>();
    if (this.valuationsMap[fk]) {
      for (const s in this.valuationsMap[fk]) {
        for (const a in this.valuationsMap[fk][s]) {
          set.add(a);
        }
      }
    }
    return Array.from(set);
  }

  computeSummaryIRTs(): void {
    const summary: FactorSummary[] = this.factors.map(f => ({
      factor: f.factor,
      irt: this.calculateImportanciaRelativaTotalFactor(f.key),
      actions: this.getFactorActions(f.key)
    }));
    this.topThreePosIRTs = summary.filter(x => x.irt >= 0)
      .sort((a,b) => b.irt - a.irt).slice(0,3);
    this.topThreeNegIRTs = summary.filter(x => x.irt < 0)
      .sort((a,b) => a.irt - b.irt).slice(0,3);
  }

  createBarChart(): void {
    const labels = this.factors.map(f => f.factor);
    const abs = this.factors.map(f => this.calculateImportanciaAbsolutaTotal(f.key));
    const rel = this.factors.map(f => this.calculateImportanciaRelativaTotalFactor(f.key));
    const ctx = this.irtBarChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.irtChart) {
      this.irtChart.data.labels = labels;
      this.irtChart.data.datasets![0].data = abs;
      this.irtChart.data.datasets![1].data = rel;
      this.irtChart.update();
    } else {
      this.irtChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'Importancia Absoluta Total', data: abs },
          { label: 'Importancia Relativa Total', data: rel }
        ]},
        options: { responsive: true }
      });
    }
  }

  createBarChartActions(): void {
    const unionActions = Array.from(new Set(this.stages.flatMap(s => s.actions)));
    const absData = unionActions.map(a =>
      this.factors.reduce((sum, f) =>
        sum + this.stages.reduce((s2, s) =>
          s2 + this.calculateImpact(f.key, s.name, a), 0
        ), 0)
    );
    const relData = unionActions.map(a =>
      this.factors.reduce((sum, f) =>
        sum + this.stages.reduce((s2, s) =>
          s2 + this.calculateImportanciaRelativaTotal(f.key, s.name, a), 0
        ), 0)
    );
    const ctx = this.irtActionsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.actionsChart) {
      this.actionsChart.data.labels = unionActions;
      this.actionsChart.data.datasets![0].data = absData;
      this.actionsChart.data.datasets![1].data = relData;
      this.actionsChart.update();
    } else {
      this.actionsChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: unionActions, datasets: [
          { label: 'Importancia Absoluta Total', data: absData },
          { label: 'Importancia Relativa Total', data: relData }
        ]},
        options: { responsive: true }
      });
    }
  }

  // Métodos auxiliares para sumas globales y agrupadas
  getGroupUIPSum(clas: string): number {
    return this.factors.filter(f => f.clasificacion === clas)
      .reduce((s, f) => s + this.getUIPValue(f.key), 0);
  }

  getGroupImpactSum(clas: string, stage: string, action: string): number {
    return this.factors.filter(f => f.clasificacion === clas)
      .reduce((s, f) => s + this.calculateImpact(f.key, stage, action), 0);
  }

  getGroupAbsoluta(clas: string): number {
    return this.factors.filter(f => f.clasificacion === clas)
      .reduce((s, f) => s + this.calculateImportanciaAbsolutaTotal(f.key), 0);
  }

  getGroupRelativa(clas: string): number {
    return this.factors.filter(f => f.clasificacion === clas)
      .reduce((s, f) => s + this.calculateImportanciaRelativaTotalFactor(f.key), 0);
  }

  getGlobalActionSum(stage: string, action: string): number {
    return this.factors.reduce((s, f) => s + this.calculateImpact(f.key, stage, action), 0);
  }

  getGlobalRelativeAction(stage: string, action: string): number {
    return this.factors.reduce((s, f) => s + this.calculateImportanciaRelativaTotal(f.key, stage, action), 0);
  }

  getGrandAbsolutaTotal(): number {
    return this.factors.reduce((s, f) => s + this.calculateImportanciaAbsolutaTotal(f.key), 0);
  }

  isLastInGroup(idx: number): boolean {
    const curr = this.factors[idx].clasificacion;
    const next = this.factors[idx+1];
    return !next || next.clasificacion !== curr;
  }

  shouldShowClasificacion(idx: number): boolean {
    return idx === 0 || this.factors[idx].clasificacion !== this.factors[idx-1].clasificacion;
  }

  getRowSpan(idx: number): number {
    const cls = this.factors[idx].clasificacion;
    let count = 1;
    for (let i = idx+1; i < this.factors.length; i++) {
      if (this.factors[i].clasificacion === cls) count++;
      else break;
    }
    return count;
  }

  getStageClass(stageName: string): string {
    const n = stageName.toLowerCase();
    if (n.includes('construcción')) return 'stage-construccion';
    if (n.includes('funcionamiento') || n.includes('operación')) return 'stage-funcionamiento';
    if (n.includes('abandono') || n.includes('cierre')) return 'stage-abandono';
    if (n.includes('comunes')) return 'stage-comunes';
    return '';
  }

  toggleValoracionMatrix(): void {
    this.showValoracionMatrix = !this.showValoracionMatrix;
  }

  toggleFactor(factorKey: string): void {
    this.expandedFactors[factorKey] = !this.expandedFactors[factorKey];
  }
}
