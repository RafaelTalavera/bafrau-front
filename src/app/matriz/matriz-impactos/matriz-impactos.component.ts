import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
import { ItemMatriz, Matriz } from '../models/matriz';
import { MatrizService } from '../service/matriz-service';
import { AdditionalFieldOptions } from '../constants/additional-flied-options';
import { Router } from '@angular/router';

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
  uip: number;
}

interface FactorView {
  factorSistema: string;
  factorSubsistema: string;
  factorComponente?: string;
  factorFactor: string;
  key: string;
}

interface FactorSummary {
  factor: string;
  irt: number;
  actions: string[];
}

@Component({
  selector: 'app-matriz-impactos',
  standalone: true,
  imports: [FormsModule, CommonModule, NavComponent, FooterComponent],
  templateUrl: './matriz-impactos.component.html',
  styleUrls: ['./matriz-impactos.component.css']
})
export class MatrizImpactosComponent implements OnInit, AfterViewInit {
  matrices: Matriz[] = [];
  selectedMatrix: Matriz | null = null;

  factors: FactorView[] = [];
  stages: Stage[] = [];
  valuationsMap: Record<string, Record<string, Record<string, string>>> = {};
  additionalMap: Record<string, Record<string, Record<string, AdditionalFields>>> = {};

  organizationFilter = '';
  expandedFactors: Record<string, boolean> = {};

  intensidadOptions = AdditionalFieldOptions.intensidadOptions;
  extensionOptions = AdditionalFieldOptions.extensionOptions;
  momentoOptions = AdditionalFieldOptions.momentoOptions;
  persistenciaOptions = AdditionalFieldOptions.persistenciaOptions;
  reversibilidadOptions = AdditionalFieldOptions.reversibilidadOptions;
  sinergiaOptions = AdditionalFieldOptions.sinergiaOptions;
  acumulacionOptions = AdditionalFieldOptions.acumulacionOptions;
  efectoOptions = AdditionalFieldOptions.efectoOptions;
  periodicidadOptions = AdditionalFieldOptions.periodicidadOptions;
  recuperacionOptions = AdditionalFieldOptions.recuperacionOptions;

  topThreePosIRTs: FactorSummary[] = [];
  topThreeNegIRTs: FactorSummary[] = [];
  irtChart?: Chart;
  actionsChart?: Chart;

  @ViewChild('irtBarChart') irtBarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('irtActionsChart') irtActionsChartRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    private router: Router,   
    private matrizService: MatrizService) {}

  ngOnInit(): void {
    this.loadMatrices();
  }

  ngAfterViewInit(): void {}

  loadMatrices(): void {
    this.matrizService.getAllMatrices().subscribe(
      data => this.matrices = data,
      err => console.error('Error cargar matrices:', err)
    );
  }

  get filteredMatrices(): Matriz[] {
    if (!this.organizationFilter.trim()) return this.matrices;
    return this.matrices.filter(m =>
      m.razonSocial?.toLowerCase().includes(this.organizationFilter.toLowerCase()) || false
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
    this.irtChart = this.actionsChart = undefined;
  }

  buildGrid(matriz: Matriz): void {
    this.factors = [];
    this.stages = [];
    this.valuationsMap = {};
    this.additionalMap = {};
    this.expandedFactors = {};

    const factorMap: Record<string, FactorView> = {};

    matriz.items.forEach(item => {
      if (!item.factorSistema || !item.factorSubsistema || !item.factorFactor) return;

      const sistema = item.factorSistema;
      const subsistema = item.factorSubsistema;
      const componente = item.factorComponente;
      const key = `${sistema}|${subsistema}|${componente ?? ''}`;

      if (!factorMap[key]) {
        factorMap[key] = {
          factorSistema: sistema,
          factorSubsistema: subsistema,
          factorFactor: item.factorFactor,
          factorComponente: componente,
          key
        };
        this.expandedFactors[key] = false;
      }

      let stage = this.stages.find(s => s.name === item.etapa);
      if (!stage) {
        stage = { name: item.etapa, actions: [] };
        this.stages.push(stage);
      }
      if (item.accionTipo && !stage.actions.includes(item.accionTipo)) {
        stage.actions.push(item.accionTipo);
      }

      this.valuationsMap[key] ||= {};
      this.valuationsMap[key][item.etapa] ||= {};
      this.valuationsMap[key][item.etapa][item.accionTipo] = item.naturaleza ?? '';

      this.additionalMap[key] ||= {};
      this.additionalMap[key][item.etapa] ||= {};
      this.additionalMap[key][item.etapa][item.accionTipo] = {
        intensidad: item.intensidad ?? 0,
        extension: item.extension ?? 0,
        momento: item.momento ?? 0,
        persistencia: item.persistencia ?? 0,
        reversibilidad: item.reversibilidad ?? 0,
        sinergia: item.sinergia ?? 0,
        acumulacion: item.acumulacion ?? 0,
        efecto: item.efecto ?? 0,
        periodicidad: item.periodicidad ?? 0,
        recuperacion: item.recuperacion ?? 0,
        uip: item.uip ?? 0,
      };
    });

    this.factors = Object.values(factorMap)
      .sort((a, b) =>
        a.factorSistema.localeCompare(b.factorSistema) ||
        a.factorSubsistema.localeCompare(b.factorSubsistema) ||
        a.factorFactor.localeCompare(b.factorFactor)
      );
    this.stages.sort((a, b) => a.name.localeCompare(b.name));

    this.computeSummaryIRTs();
    setTimeout(() => {
      this.createBarChart();
      this.createBarChartActions();
    }, 100);
  }

  toggleFactor(key: string): void {
    this.expandedFactors[key] = !this.expandedFactors[key];
  }

  updateAdditionalValues(): void {
    if (!this.selectedMatrix?.id) return;

    this.factors.forEach(f => {
      this.stages.forEach(st => {
        st.actions.forEach(action => {
          const add = this.additionalMap[f.key]?.[st.name]?.[action];
          if (!add) return;
          const item = this.selectedMatrix!.items.find(i =>
            `${i.factorSistema}|${i.factorSubsistema}|${i.factorComponente ?? ''}` === f.key &&
            i.etapa === st.name &&
            i.accionTipo === action
          );
          if (!item) return;

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
          item.uip = add.uip;
          item.magnitude = this.calculateImpact(f.key, st.name, action);
          item.importance = this.calculateImportanciaRelativaTotal(f.key, st.name, action);
        });
      });
    });

    this.matrizService.updateMatriz(this.selectedMatrix.id, this.selectedMatrix)
      .subscribe(
        () => Swal.fire('Actualizado', 'Correcto', 'success'),
        () => Swal.fire('Error', 'No se pudo actualizar', 'error')
      );
  }

  calculateImpact(factorKey: string, stage: string, action: string): number {
    const val = this.valuationsMap[factorKey]?.[stage]?.[action]?.toLowerCase() || '';
    const sign = val === 'positivo' ? 1 : val === 'negativo' ? -1 : 0;
    const a = this.getAdditional(factorKey, stage, action);
    return sign * (
      3 * a.intensidad + 2 * a.extension + a.momento + a.persistencia +
      a.reversibilidad + a.sinergia + a.acumulacion + a.efecto +
      a.periodicidad + a.recuperacion
    );
  }

  calculateImportanciaRelativaTotal(factorKey: string, stage: string, action: string): number {
    const impact = this.calculateImpact(factorKey, stage, action);
    const uip = this.getAdditional(factorKey, stage, action).uip;
    return impact * (uip / 1000);
  }

  calculateImportanciaAbsolutaTotal(factorKey: string): number {
    let total = 0;
    this.stages.forEach(st => {
      Object.keys(this.valuationsMap[factorKey]?.[st.name] || {}).forEach(ac => {
        total += this.calculateImpact(factorKey, st.name, ac);
      });
    });
    return total;
  }

  calculateImportanciaRelativaTotalFactor(factorKey: string): number {
    let sum = 0;
    this.stages.forEach(st => {
      Object.keys(this.valuationsMap[factorKey]?.[st.name] || {}).forEach(ac => {
        sum += this.calculateImpact(factorKey, st.name, ac) * this.getAdditional(factorKey, st.name, ac).uip;
      });
    });
    return sum / 1000;
  }

  getAdditional(fk: string, st: string, ac: string): AdditionalFields {
    this.additionalMap[fk] ||= {};
    this.additionalMap[fk][st] ||= {};
    this.additionalMap[fk][st][ac] ||= {
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
      uip: 0
    };
    return this.additionalMap[fk][st][ac];
  }

  getUIPValue(fk: string): number {
    const values = Object.values(this.additionalMap[fk] || {}).flatMap(v => Object.values(v).map(a => a.uip));
    return values.length > 0 ? values[0] : 0;
  }

  computeSummaryIRTs(): void {
    const summary = this.factors.map(f => ({
      factor: f.factorFactor,
      irt: this.calculateImportanciaRelativaTotalFactor(f.key),
      actions: Object.keys(this.valuationsMap[f.key] || {}).flatMap(st => Object.keys(this.valuationsMap[f.key][st] || {}))
    }));
    this.topThreePosIRTs = summary.filter(i => i.irt >= 0).sort((a, b) => b.irt - a.irt).slice(0, 3);
    this.topThreeNegIRTs = summary.filter(i => i.irt < 0).sort((a, b) => a.irt - b.irt).slice(0, 3);
  }


  createBarChart(): void {
    const labels: string[] = [], pos: number[] = [], neg: number[] = [];
    this.factors.forEach(f => {
      const v = this.calculateImportanciaRelativaTotalFactor(f.key);
      labels.push(f.factorFactor);
      v>=0 ? (pos.push(v), neg.push(0)) : (pos.push(0), neg.push(v));
    });
    const ctx = this.irtBarChartRef.nativeElement.getContext('2d')!;
    if (this.irtChart) {
      this.irtChart.data.labels = labels;
      this.irtChart.data.datasets[0].data = pos;
      this.irtChart.data.datasets[1].data = neg;
      this.irtChart.update();
    } else {
      this.irtChart = new Chart(ctx,{
        type:'bar',
        data:{ labels, datasets:[
          { label:'IRT Positivos', data:pos },
          { label:'IRT Negativos', data:neg }
        ]},
        options:{ responsive:true }
      });
    }
  }

  createBarChartActions(): void {
    const actions = Array.from(new Set(this.stages.flatMap(s=>s.actions)));
    const labels = this.factors.map(f=>f.factorFactor);
    const datasets = actions.map(a=>({
      label:a,
      data:this.factors.map(f=>{
        let sum=0;
        this.stages.forEach(st=>{
          if(this.valuationsMap[f.key]?.[st.name]?.[a]!==undefined){
            sum+=this.calculateImpact(f.key,st.name,a);
          }
        });
        return sum;
      })
    }));
    const ctx = this.irtActionsChartRef.nativeElement.getContext('2d')!;
    if(this.actionsChart){
      this.actionsChart.data.labels = labels;
      this.actionsChart.data.datasets = datasets;
      this.actionsChart.update();
    } else {
      this.actionsChart = new Chart(ctx,{
        type:'bar',
        data:{ labels, datasets },
        options:{ responsive:true }
      });
    }
  }

  getGroupUIPSum(sistema: string): number {
    return this.factors.filter(f=>f.factorSistema===sistema)
      .reduce((acc,f)=>acc+this.getUIPValue(f.key),0);
  }

  getGroupImpactSum(sistema: string, st: string, ac: string): number {
    return this.factors.filter(f=>f.factorSistema===sistema)
      .reduce((acc,f)=>acc+this.calculateImpact(f.key,st,ac),0);
  }

  getGroupAbsoluta(sistema: string): number {
    return this.factors.filter(f=>f.factorSistema===sistema)
      .reduce((acc,f)=>acc+this.calculateImportanciaAbsolutaTotal(f.key),0);
  }

  getGroupRelativa(sistema: string): number {
    return this.factors.filter(f=>f.factorSistema===sistema)
      .reduce((acc,f)=>acc+this.calculateImportanciaRelativaTotalFactor(f.key),0);
  }

  getGlobalActionSum(st: string, ac: string): number {
    return this.factors.reduce((acc,f)=>acc+this.calculateImpact(f.key,st,ac),0);
  }

  getGrandAbsolutaTotal(): number {
    return this.factors.reduce((acc,f)=>acc+this.calculateImportanciaAbsolutaTotal(f.key),0);
  }

  getGlobalRelativeAction(st: string, ac: string): number {
    return this.factors.reduce((acc,f)=>acc+this.calculateImportanciaRelativaTotal(f.key,st,ac),0);
  }

  isLastInGroup(i: number): boolean {
    return i===0 || this.factors[i].factorSistema!==this.factors[i-1].factorSistema;
  }

  getStageClass(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('construcci')) return 'stage-construccion';
    if (n.includes('funcionamiento')||n.includes('operación')) return 'stage-funcionamiento';
    if (n.includes('abandono')||n.includes('cierre')) return 'stage-abandono';
    if (n.includes('comunes')) return 'stage-comunes';
    return '';
  }

  shouldShowClasificacion(i: number): boolean {
    return this.isLastInGroup(i);
  }

  getRowSpan(i: number): number {
    let count = 1;
    const sistema = this.factors[i].factorSistema;
    for (let j=i+1; j<this.factors.length; j++){
      if(this.factors[j].factorSistema===sistema) count++;
      else break;
    }
    return count;
  }

}
