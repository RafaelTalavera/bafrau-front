import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
import { ItemMatriz, Matriz } from '../models/matriz';
import { MatrizService } from '../service/matriz-service';

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
  factorMedio: string;
  factorFactor: string;
  key: string;
  factorComponente?: string;
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

  intensidadOptions = [
    { label: 'Baja', value: 1 },
    { label: 'Media', value: 2 },
    { label: 'Alta', value: 3 },
    { label: 'Muy alta', value: 8 },
    { label: 'Total', value: 12 }
  ];
  extensionOptions = [
    { label: 'Puntual', value: 1 },
    { label: 'Parcial', value: 2 },
    { label: 'Extenso', value: 4 },
    { label: 'Total', value: 8 },
    { label: 'Crítica', value: 12 }
  ];
  momentoOptions = [
    { label: 'Largo plazo', value: 1 },
    { label: 'Mediano plazo', value: 2 },
    { label: 'Inmediato', value: 4 },
    { label: 'Crítico', value: 8 }
  ];
  persistenciaOptions = [
    { label: 'Fugaz', value: 1 },
    { label: 'Temporal', value: 2 },
    { label: 'Permanente', value: 4 }
  ];
  reversibilidadOptions = [
    { label: 'Corto plazo', value: 1 },
    { label: 'Mediano plazo', value: 2 },
    { label: 'Irreversible', value: 4 }
  ];
  sinergiaOptions = [
    { label: 'Sin sinergismo', value: 1 },
    { label: 'Sinérgico', value: 2 },
    { label: 'Muy sinérgico', value: 4 }
  ];
  acumulacionOptions = [
    { label: 'Simple', value: 1 },
    { label: 'Acumulativo', value: 4 }
  ];
  efectoOptions = [
    { label: 'Indirecto', value: 1 },
    { label: 'Directo', value: 4 }
  ];
  periodicidadOptions = [
    { label: 'Irregular', value: 1 },
    { label: 'Periódico', value: 2 },
    { label: 'Continuo', value: 4 }
  ];
  recuperacionOptions = [
    { label: 'Recuperable inmediato', value: 1 },
    { label: 'Recuperable a mediano plazo', value: 2 },
    { label: 'Mitigable', value: 4 },
    { label: 'Irrecuperable', value: 8 }
  ];

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
      if (!item.factorComponente || !item.etapa || !item.accionTipo) return;

      const medio = item.factorMedio || 'N/A';
      const key = `${medio}|${item.factorComponente}`;

      if (!factorMap[key]) {
        factorMap[key] = {
          factorMedio: medio,
          factorFactor: item.factorFactor,
          key,
          factorComponente: item.factorComponente
        };
        this.expandedFactors[key] = false;
      }

      let stage = this.stages.find(s => s.name === item.etapa);
      if (!stage) {
        stage = { name: item.etapa, actions: [] };
        this.stages.push(stage);
      }
      if (!stage.actions.includes(item.accionTipo)) {
        stage.actions.push(item.accionTipo);
      }

      this.valuationsMap[key] ??= {};
      this.valuationsMap[key][item.etapa] ??= {};
      this.valuationsMap[key][item.etapa][item.accionTipo] = item.naturaleza ?? '';

      this.additionalMap[key] ??= {};
      this.additionalMap[key][item.etapa] ??= {};
      this.additionalMap[key][item.etapa][item.accionTipo] = {
        intensidad: item.intensidad  ?? 0,
        extension: item.extension      ?? 0,
        momento: item.momento          ?? 0,
        persistencia: item.persistencia ?? 0,
        reversibilidad: item.reversibilidad ?? 0,
        sinergia: item.sinergia        ?? 0,
        acumulacion: item.acumulacion  ?? 0,
        efecto: item.efecto            ?? 0,
        periodicidad: item.periodicidad ?? 0,
        recuperacion: item.recuperacion ?? 0,
        UIP: item.uip                  ?? 100
      };
    });

    this.factors = Object.values(factorMap)
      .sort((a, b) => a.factorMedio.localeCompare(b.factorMedio) || a.factorFactor.localeCompare(b.factorFactor));
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
            `${i.factorMedio||'N/A'}|${i.factorComponente}` === f.key &&
            i.etapa === st.name &&
            i.accionTipo === action
          );
          if (!item) return;

          item.intensidad = add.intensidad;
          item.extension   = add.extension;
          item.momento     = add.momento;
          item.persistencia= add.persistencia;
          item.reversibilidad= add.reversibilidad;
          item.sinergia    = add.sinergia;
          item.acumulacion = add.acumulacion;
          item.efecto      = add.efecto;
          item.periodicidad= add.periodicidad;
          item.recuperacion= add.recuperacion;
          item.uip         = add.UIP;

          item.magnitude   = this.calculateImpact(f.key, st.name, action);
          item.importance  = this.calculateImportanciaRelativaTotal(f.key, st.name, action);
        });
      });
    });

    this.matrizService.updateMatriz(this.selectedMatrix.id, this.selectedMatrix)
      .subscribe(
        () => Swal.fire('Actualizado', 'Correcto', 'success'),
        err => Swal.fire('Error', 'No se pudo actualizar', 'error')
      );
  }

  calculateImpact(factorKey: string, stage: string, action: string): number {
    const val = this.valuationsMap[factorKey]?.[stage]?.[action]?.toLowerCase() || '';
    const sign = val === 'positivo' ? 1 : val === 'negativo' ? -1 : 0;
    const a = this.getAdditional(factorKey, stage, action);
    return sign * (
      3*a.intensidad + 2*a.extension + a.momento + a.persistencia +
      a.reversibilidad + a.sinergia + a.acumulacion + a.efecto +
      a.periodicidad + a.recuperacion
    );
  }

  calculateImportanciaRelativaTotal(factorKey: string, stage: string, action: string): number {
    const impact = this.calculateImpact(factorKey, stage, action);
    const uip = this.getAdditional(factorKey, stage, action).UIP || 100;
    return impact * (uip / 100);
  }

  calculateImportanciaAbsolutaTotal(factorKey: string): number {
    let total = 0;
    this.stages.forEach(st => {
      Object.keys(this.valuationsMap[factorKey]?.[st.name] || {})
        .forEach((action: string) => {
          total += this.calculateImpact(factorKey, st.name, action);
        });
    });
    return total;
  }

  calculateImportanciaRelativaTotalFactor(factorKey: string): number {
    let sum = 0;
    this.stages.forEach(st => {
      Object.keys(this.valuationsMap[factorKey]?.[st.name] || {})
        .forEach((action: string) => {
          sum += this.calculateImpact(factorKey, st.name, action)
               * this.getAdditional(factorKey, st.name, action).UIP;
        });
    });
    return sum / 1000;
  }

  getAdditional(fk: string, st: string, ac: string): AdditionalFields {
    this.additionalMap[fk] ??= {};
    this.additionalMap[fk][st] ??= {};
    this.additionalMap[fk][st][ac] ??= {
      intensidad:0, extension:0, momento:0,
      persistencia:0, reversibilidad:0, sinergia:0,
      acumulacion:0, efecto:0, periodicidad:0,
      recuperacion:0, UIP:100
    };
    return this.additionalMap[fk][st][ac];
  }

  getUIPValue(fk: string): number {
    return Object.values(this.additionalMap[fk] || {})
      .flatMap(v=>Object.values(v))
      .map(a=>a.UIP)[0]||100;
  }

  computeSummaryIRTs(): void {
    const sum: FactorSummary[] = this.factors.map(f=>({
      factor: f.factorFactor,
      irt: this.calculateImportanciaRelativaTotalFactor(f.key),
      actions: Object.keys(this.valuationsMap[f.key]||{}).flatMap(st=>Object.keys(this.valuationsMap[f.key][st]||{}))
    }));
    this.topThreePosIRTs = sum.filter(i=>i.irt>=0).sort((a,b)=>b.irt-a.irt).slice(0,3);
    this.topThreeNegIRTs = sum.filter(i=>i.irt<0).sort((a,b)=>a.irt-b.irt).slice(0,3);
  }

  createBarChart(): void {
    const labels:string[]=[]; const pos:number[]=[]; const neg:number[]=[];
    this.factors.forEach(f=>{
      const v=this.calculateImportanciaRelativaTotalFactor(f.key);
      labels.push(f.factorFactor);
      v>=0?(pos.push(v),neg.push(0)):(pos.push(0),neg.push(v));
    });
    const ctx=this.irtBarChartRef.nativeElement.getContext('2d')!;
    if(this.irtChart){
      this.irtChart.data.labels=labels;
      this.irtChart.data.datasets[0].data=pos;
      this.irtChart.data.datasets[1].data=neg;
      this.irtChart.update();
    } else {
      this.irtChart=new Chart(ctx,{
        type:'bar',
        data:{labels,datasets:[
          {label:'IRT Positivos',data:pos},
          {label:'IRT Negativos',data:neg}
        ]},
        options:{responsive:true}
      });
    }
  }

  createBarChartActions(): void {
    const actions=Array.from(new Set(this.stages.flatMap(s=>s.actions)));
    const labels=this.factors.map(f=>f.factorFactor);
    const datasets=actions.map(a=>({
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
    const ctx=this.irtActionsChartRef.nativeElement.getContext('2d')!;
    if(this.actionsChart){
      this.actionsChart.data.labels=labels;
      this.actionsChart.data.datasets=datasets;
      this.actionsChart.update();
    } else {
      this.actionsChart=new Chart(ctx,{
        type:'bar',
        data:{labels,datasets},
        options:{responsive:true}
      });
    }
  }

  getGroupUIPSum(medio:string):number{
    return this.factors.filter(f=>f.factorMedio===medio)
      .reduce((acc,f)=>acc+this.getUIPValue(f.key),0);
  }

  getGroupImpactSum(medio:string,st:string,ac:string):number{
    return this.factors.filter(f=>f.factorMedio===medio)
      .reduce((acc,f)=>acc+this.calculateImpact(f.key,st,ac),0);
  }

  getGroupAbsoluta(medio:string):number{
    return this.factors.filter(f=>f.factorMedio===medio)
      .reduce((acc,f)=>acc+this.calculateImportanciaAbsolutaTotal(f.key),0);
  }

  getGroupRelativa(medio:string):number{
    return this.factors.filter(f=>f.factorMedio===medio)
      .reduce((acc,f)=>acc+this.calculateImportanciaRelativaTotalFactor(f.key),0);
  }

  getGlobalActionSum(st:string,ac:string):number{
    return this.factors.reduce((acc,f)=>acc+this.calculateImpact(f.key,st,ac),0);
  }

  getGrandAbsolutaTotal():number{
    return this.factors.reduce((acc,f)=>acc+this.calculateImportanciaAbsolutaTotal(f.key),0);
  }

  getGlobalRelativeAction(st:string,ac:string):number{
    return this.factors.reduce((acc,f)=>acc+this.calculateImportanciaRelativaTotal(f.key,st,ac),0);
  }

  isLastInGroup(i:number):boolean{
    return i===0 || this.factors[i].factorMedio!==this.factors[i-1].factorMedio;
  }

  getStageClass(name:string):string{
    const n=name.toLowerCase();
    if(n.includes('construcción'))return 'stage-construccion';
    if(n.includes('funcionamiento')||n.includes('operación'))return 'stage-funcionamiento';
    if(n.includes('abandono')||n.includes('cierre'))return 'stage-abandono';
    if(n.includes('comunes'))return 'stage-comunes';
    return '';
  }

  shouldShowClasificacion(i:number):boolean{
    return this.isLastInGroup(i);
  }

  getRowSpan(i:number):number{
    let c=1,medio=this.factors[i].factorMedio;
    for(let j=i+1;j<this.factors.length;j++){
      if(this.factors[j].factorMedio===medio)c++;
      else break;
    }
    return c;
  }

}
