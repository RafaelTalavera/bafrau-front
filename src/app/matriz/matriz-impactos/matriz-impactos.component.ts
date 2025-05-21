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
import { AdditionalFields, FactorView, MatrizBuilderUnifiedService, Stage } from '../service/matriz-builder-unified.service';

Chart.register(...registerables);

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

  showNumeric = false;

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

   // ← Banderas de carga
   loadingList: boolean = false;
   loadingDetail: boolean = false;
 

  @ViewChild('irtBarChart') irtBarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('irtActionsChart') irtActionsChartRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    private router: Router,
    private matrizService: MatrizService,
    private gridBuilder: MatrizBuilderUnifiedService
  ) { }

  ngOnInit(): void {
    this.loadMatrices();
  }

  ngAfterViewInit(): void { }

  loadMatrices(): void {
    this.loadingList = true;  // inicia spinner
    this.matrizService.getAllMatrices().subscribe(
      data => {
        this.matrices = data;
        this.loadingList = false;  // detiene spinner
      },
      err => {
        console.error('Error cargar matrices:', err);
        this.loadingList = false;  // detiene spinner
      }
    );
  }

  get filteredMatrices(): Matriz[] {
    if (!this.organizationFilter.trim()) return this.matrices;
    return this.matrices.filter(m =>
      m.razonSocial?.toLowerCase().includes(this.organizationFilter.toLowerCase()) || false
    );
  }

 // matriz-impactos.component.ts
 viewDetails(matrix: Matriz): void {
  this.loadingDetail = true;  // inicia spinner detalle
  this.matrizService.getMatrizById(matrix.id).subscribe(
    fullMatrix => {
      this.selectedMatrix = fullMatrix;
      this.buildGrid(fullMatrix);
      this.loadingDetail = false;  // detiene spinner detalle
    },
    err => {
      console.error('No pudo cargar detalle:', err);
      this.loadingDetail = false;  // detiene spinner detalle
    }
  );
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

// Dentro de MatrizImpactosComponent:
buildGrid(matriz: Matriz): void {
  // 1) Reiniciar resúmenes
  this.topThreePosIRTs = [];
  this.topThreeNegIRTs = [];

  const items = matriz.items;
  // 2) Usar el servicio unificado
  const { factors, stages, valuationsMap, additionalMap } =
    this.gridBuilder.buildGrid(items);

  // 3) Asignar y ordenar factores
  this.factors = factors.sort((a, b) =>
    a.sistema.localeCompare(b.sistema) ||
    a.subsistema.localeCompare(b.subsistema) ||
    (a.componente ?? '').localeCompare(b.componente ?? '') ||
    a.factor.localeCompare(b.factor)
  );
  this.stages        = stages;
  this.valuationsMap = valuationsMap;
  this.additionalMap = additionalMap;

  // 4) Inicializar expandedFactors (clave = id.toString())
  this.expandedFactors = Object.fromEntries(
    this.factors.map(f => [f.id.toString(), false])
  );

  // 5) Inyectar UIP real en additionalMap
  items.forEach(item => {
    const bucket = this.additionalMap[item.factorId]?.[item.etapa]?.[item.accionTipo];
    if (bucket) bucket.uip = item.uip ?? 0;
  });

  // 6) Calcular resúmenes y dibujar gráficas
  this.computeSummaryIRTs();
  setTimeout(() => {
    this.createBarChart();
    this.createBarChartActions();
  }, 100);
}

  toggleNumericView(): void {
    this.showNumeric = !this.showNumeric;
  }

  getNumericMatrix(): any[] {
    if (!this.selectedMatrix) {
      return [];
    }
    return this.selectedMatrix.items.map(item => ({
      id:               item.id,
      etapa:            item.etapa,
      intensidad:       item.intensidad,
      extension:        item.extension,
      momento:          item.momento,
      persistencia:     item.persistencia,
      reversivilidad:   item.reversivilidad,
      sinergia:         item.sinergia,
      acumulacion:      item.acumulacion,
      efecto:           item.efecto,
      periodicidad:     item.periodicidad,
      recuperacion:     item.recuperacion,
      uip:              item.uip,
      magnitude:        item.magnitude,
      importance:       item.importance
    }));
  }

  showNumericPopup(): void {
    if (!this.selectedMatrix) {
      Swal.fire('Atención', 'No hay ninguna matriz seleccionada.', 'warning');
      return;
    }
  
    const rows = this.selectedMatrix.items.map(item => `
      <tr>
        <td>${item.factorSistema}</td>
        <td>${item.factorSubsistema}</td>
        <td>${item.factorComponente ?? ''}</td>
        <td>${item.factorFactor}</td>
        <td>${item.etapa}</td>
        <td>${item.accionTipo}</td>
        <td>${item.intensidad}</td>
        <td>${item.extension}</td>
        <td>${item.momento}</td>
        <td>${item.persistencia}</td>
        <td>${item.reversivilidad}</td>
        <td>${item.sinergia}</td>
        <td>${item.acumulacion}</td>
        <td>${item.efecto}</td>
        <td>${item.periodicidad}</td>
        <td>${item.recuperacion}</td>
        <td>${item.uip}</td>
        <td>${item.magnitude}</td>
        <td>${item.importance}</td>
      </tr>
    `).join('');
  
    const htmlTable = `
      <div style="overflow:auto; max-height:60vh; font-size:10px;">
        <table style="width:100%; border-collapse:collapse; font-size:10px;">
          <thead>
            <tr>
              <th>Sistema</th><th>Subsistema</th><th>Componente</th><th>Factor</th>
              <th>Etapa</th><th>Acción</th>
              <th>Int</th><th>Ext</th><th>Mo</th><th>Per</th><th>Rev</th>
              <th>Sin</th><th>Acu</th><th>Efe</th><th>Peri</th><th>Recu</th>
              <th>UIP</th><th>Magn</th><th>Imp</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  
    Swal.fire({
      title: 'Matriz Numérica',
      html: htmlTable,
      width: '95%',
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: 'Cerrar'
    });
  }
  
  

  toggleFactor(key: string): void {
    this.expandedFactors[key] = !this.expandedFactors[key];
  }

updateAdditionalValues(): void {
  if (!this.selectedMatrix?.id) return;

  this.factors.forEach(f => {
    this.stages.forEach(st => {
      st.actions.forEach(action => {
        const add = this.additionalMap[f.id]?.[st.name]?.[action];
        if (!add) return;

        const item = this.selectedMatrix!.items.find(i =>
          i.factorId  === f.id &&
          i.etapa      === st.name &&
          i.accionTipo === action
        );
        if (!item) return;

        // asignar valores…
        item.intensidad     = add.intensidad;
        item.extension      = add.extension;
        item.momento        = add.momento;
        item.persistencia   = add.persistencia;
        item.reversivilidad = add.reversibilidad;
        item.sinergia       = add.sinergia;
        item.acumulacion    = add.acumulacion;
        item.efecto         = add.efecto;
        item.periodicidad   = add.periodicidad;
        item.recuperacion   = add.recuperacion;
        item.uip            = add.uip;

        // recalcular usando f.id (number)
        item.magnitude  = this.calculateImpact(f.id, st.name, action);
        item.importance = this.calculateImportanciaRelativaTotal(f.id, st.name, action);
      });
    });
  });


    this.matrizService.updateMatriz(this.selectedMatrix.id, this.selectedMatrix)
      .subscribe(
        () => {
          Swal.fire('Actualizado', 'Correcto', 'success')
            .then(() => {
              // Volver a cargar datos y reconstruir la vista
              this.loadMatrices();
              if (this.selectedMatrix) {
                this.viewDetails(this.selectedMatrix);
              }
            });
        },
        () => Swal.fire('Error', 'No se pudo actualizar', 'error')
      );
  }

// En tu componente, cambia la firma para usar factorId: number
calculateImpact(factorId: number, stage: string, action: string): number {
  const val = this.valuationsMap[factorId]?.[stage]?.[action]?.toLowerCase() || '';
  const sign = val === 'positivo' 
    ? 1 
    : val === 'negativo' 
      ? -1 
      : 0;
  const a = this.getAdditional(factorId, stage, action);
  return sign * (
    3 * a.intensidad +
    2 * a.extension +
    a.momento +
    a.persistencia +
    a.reversibilidad +
    a.sinergia +
    a.acumulacion +
    a.efecto +
    a.periodicidad +
    a.recuperacion
  );
}


calculateImportanciaRelativaTotal(factorId: number, stage: string, action: string): number {
  const impact = this.calculateImpact(factorId, stage, action);
  const uip    = this.getAdditional(factorId, stage, action).uip;
  return impact * (uip/1000);
}

calculateImportanciaAbsolutaTotal(factorId: number): number {
  let total = 0;
  this.stages.forEach(st => {
    Object
      .keys(this.valuationsMap[factorId]?.[st.name] || {})
      .forEach(ac => {
        total += this.calculateImpact(factorId, st.name, ac);
      });
  });
  return total;
}

calculateImportanciaRelativaTotalFactor(factorId: number): number {
  return this.selectedMatrix!.items
    .filter(i => i.factorId === factorId)
    .reduce((sum, i) =>
      sum + this.calculateImpact(factorId, i.etapa, i.accionTipo) * (i.uip / 1000)
    , 0);
}
  

getAdditional(factorId: number, stage: string, action: string): AdditionalFields {
  this.additionalMap[factorId]          ||= {};
  this.additionalMap[factorId][stage]   ||= {};
  this.additionalMap[factorId][stage][action] ||= {
    intensidad:   0,
    extension:    0,
    momento:      0,
    persistencia: 0,
    reversibilidad: 0,
    sinergia:     0,
    acumulacion:  0,
    efecto:       0,
    periodicidad: 0,
    recuperacion: 0,
    uip:          0
  };
  return this.additionalMap[factorId][stage][action];
}


getUIPValue(factorId: number): number {
  const vals = Object.values(this.additionalMap[factorId] || {})
    .flatMap(v => Object.values(v).map(a => a.uip));
  return vals.length > 0 ? vals[0] : 0;
}

computeSummaryIRTs(): void {
  const summary = this.factors.map(f => ({
    factor: f.factor,
    irt: this.calculateImportanciaRelativaTotalFactor(f.id),
    actions: Object
      .keys(this.valuationsMap[f.id] || {})
      .flatMap(stage =>
        Object.keys(this.valuationsMap[f.id][stage] || {})
      )
  }));

  this.topThreePosIRTs = summary
    .filter(i => i.irt >= 0)
    .sort((a, b) => b.irt - a.irt)
    .slice(0, 3);

  this.topThreeNegIRTs = summary
    .filter(i => i.irt < 0)
    .sort((a, b) => a.irt - b.irt)
    .slice(0, 3);
}


createBarChart(): void {
  const labels: string[] = [];
  const pos: number[] = [];
  const neg: number[] = [];

  this.factors.forEach(f => {
    // 1) Usamos f.id en lugar de f.key
    const v = this.calculateImportanciaRelativaTotalFactor(f.id);
    labels.push(f.factor);
    if (v >= 0) {
      pos.push(v);
      neg.push(0);
    } else {
      pos.push(0);
      neg.push(v);
    }
  });

  const ctx = this.irtBarChartRef.nativeElement.getContext('2d')!;
  if (this.irtChart) {
    this.irtChart.data.labels = labels;
    this.irtChart.data.datasets[0].data = pos;
    this.irtChart.data.datasets[1].data = neg;
    this.irtChart.update();
  } else {
    this.irtChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'IRT Positivos', data: pos },
          { label: 'IRT Negativos', data: neg }
        ]
      },
      options: { responsive: true }
    });
  }
}


createBarChartActions(): void {
  const actions = Array.from(new Set(this.stages.flatMap(s => s.actions)));
  const labels = this.factors.map(f => f.factor);
  const datasets = actions.map(a => ({
    label: a,
    data: this.factors.map(f =>
      this.stages.reduce((sum, st) =>
        sum + (this.valuationsMap[f.id]?.[st.name]?.[a] !== undefined
          ? this.calculateImpact(f.id, st.name, a)
          : 0)
      , 0)
    )
  }));

  const ctx = this.irtActionsChartRef.nativeElement.getContext('2d')!;
  if (this.actionsChart) {
    this.actionsChart.data.labels = labels;
    this.actionsChart.data.datasets = datasets;
    this.actionsChart.update();
  } else {
    this.actionsChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: { responsive: true }
    });
  }
}


getGroupUIPSum(sistema: string): number {
  return this.factors
    .filter(f => f.sistema === sistema)
    .reduce((acc, f) =>
      acc + this.getUIPValue(f.id)
    , 0);
}

  getGroupImpactSum(sistema: string, st: string, ac: string): number {
    return this.factors.filter(f => f.sistema === sistema)
      .reduce((acc, f) => acc + this.calculateImpact(f.id, st, ac), 0);
  }

  getGroupAbsoluta(sistema: string): number {
    return this.factors.filter(f => f.sistema === sistema)
      .reduce((acc, f) => acc + this.calculateImportanciaAbsolutaTotal(f.id), 0);
  }

  getGroupRelativa(sistema: string): number {
    return this.factors.filter(f => f.sistema === sistema)
      .reduce((acc, f) => acc + this.calculateImportanciaRelativaTotalFactor(f.id), 0);
  }

  getGlobalActionSum(st: string, ac: string): number {
    return this.factors.reduce((acc, f) => acc + this.calculateImpact(f.id, st, ac), 0);
  }

  getGrandAbsolutaTotal(): number {
    return this.factors.reduce((acc, f) => acc + this.calculateImportanciaAbsolutaTotal(f.id), 0);
  }

  getGlobalRelativeAction(st: string, ac: string): number {
    return this.factors.reduce((acc, f) => acc + this.calculateImportanciaRelativaTotal(f.id, st, ac), 0);
  }


  isFirstOfSystemFactor(i: number): boolean {
    return i === 0
      || this.factors[i].sistema !== this.factors[i - 1].sistema;
  }

  getSystemRowSpanFactor(i: number): number {
    const sis = this.factors[i].sistema;
    let count = 0;
    for (let j = i; j < this.factors.length; j++) {
      if (this.factors[j].sistema === sis) count++;
      else break;
    }
    return count;
  }

  isLastOfSystemFactor(i: number): boolean {
    return i === this.factors.length - 1
      || this.factors[i + 1].sistema !== this.factors[i].sistema;
  }

  getStageClass(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('construcci')) return 'stage-construccion';
    if (n.includes('funcionamiento') || n.includes('operación')) return 'stage-funcionamiento';
    if (n.includes('abandono') || n.includes('cierre')) return 'stage-abandono';
    if (n.includes('comunes')) return 'stage-comunes';
    return '';
  }

  getSign(key: string, stage: string, action: string): string {
    const val = this.valuationsMap[key]?.[stage]?.[action];
    return val === 'positivo' ? '+'
      : val === 'negativo' ? '−'
        : val === 'neutro' ? '0'
          : '--';
  }

  shouldShowTopThreePosIRTs(): boolean {
    return this.topThreePosIRTs.some(item => item.irt > 0);
  }
  
shouldShowIrtBarChart(): boolean {
  return this.factors.some(f =>
    this.calculateImportanciaRelativaTotalFactor(f.id) !== 0
  );
}


shouldShowIrtActionsChart(): boolean {
  return this.factors.some(f =>
    this.stages.some(st =>
      st.actions.some(ac =>
        this.calculateImpact(f.id, st.name, ac) !== 0
      )
    )
  );
  
}
}
