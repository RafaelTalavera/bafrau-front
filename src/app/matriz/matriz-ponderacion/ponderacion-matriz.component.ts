import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import Swal from 'sweetalert2';
import { ItemMatriz, Matriz } from '../models/matriz';
import { MatrizService } from '../service/matriz-service';
import { AdjuntosService } from '../../utils/adjuntos.service';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';

export interface AdditionalFields { uip: number; }
interface Stage { name: string; actions: string[]; }
interface FactorView { sistema: string; subsistema: string; factor: string; Componente: string; key: string; uip: number; itemMatrizId: number; }
export interface ItemUIPUpdateDTO { itemId: number; uip: number; }
interface ActionIRTSummary { etapa: string; accion: string; irt: number; }

@Component({
  selector: 'app-ponderacion-matriz',
  standalone: true,
  imports: [FormsModule, 
            CommonModule, 
            NavComponent,
            FooterComponent,
            SpinnerComponent  
          ],
  templateUrl: './ponderacion-matriz.component.html',
  styleUrls: ['./ponderacion-matriz.component.css']
})
export class PonderacionMatrizComponent implements OnInit {
  public razonSocial: string = '';
   public sectionId?: number; 

  matrices: Matriz[] = [];
  selectedMatrix: Matriz | null = null;
  factors: FactorView[] = [];
  stages: Stage[] = [];
  additionalMap: { [key: string]: { [stage: string]: { [action: string]: AdditionalFields } } } = {};
  valuationsMap: { [key: string]: { [stage: string]: { [action: string]: string } } } = {};
  organizationFilter = '';
  expandedFactors: { [key: string]: boolean } = {};
  totalUIP = 0;
  readonly TOTAL_DISTRIBUCION = 1000;

  @ViewChild('uipTableVisualizacion') uipTableVisualizacion!: ElementRef<HTMLDivElement>;
  loading = false;
  loadError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private matrizService: MatrizService,
    private adjuntosService: AdjuntosService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const raw = params.get('razonSocial') ?? '';
      this.razonSocial = decodeURIComponent(raw).trim();
      this.organizationFilter = this.razonSocial;

      // ← Leemos el sectionId si viene en la URL
      const sec = params.get('sectionId');
      this.sectionId = sec ? +sec : undefined;

      this.loadMatrices();
    });
  }

loadMatrices(): void {
  this.loadError = null;
  this.loading = true;                         // ← Activa el spinner
  this.cdr.detectChanges();                    // ← Fuerza detección para que aparezca inmediatamente
  this.matrizService.getAllMatrices().subscribe(
    data => {
      this.matrices = data;
      this.loading = false;                    // ← Desactiva el spinner al recibir datos
      this.cdr.detectChanges();
    },
    err => {
      console.error('Error al cargar matrices:', err);
      this.matrices = [];
      this.loadError = err?.status === 401 || err?.status === 403
        ? 'No se pudo validar la sesion. Cierre la sesion e ingrese nuevamente.'
        : 'No se pudieron cargar las matrices. Intente nuevamente.';
      this.loading = false;                    // ← Desactiva el spinner también en error
      this.cdr.detectChanges();
    }
  );
}


  get filteredMatrices(): Matriz[] {
    const filtro = this.organizationFilter.trim().toLowerCase();
    if (!filtro) return this.matrices;
    return this.matrices.filter(m =>
      m.items.some(item =>
        (item.razonSocial ?? '').toLowerCase().includes(filtro)
      )
    );
  }

  viewDetails(matrix: Matriz): void {
    this.selectedMatrix = matrix;
    this.buildGrid(matrix);
    this.calculateTotalUIP();
  }

  backToList(): void {
    this.selectedMatrix = null;
    this.factors = [];
    this.stages = [];
    this.additionalMap = {};
    this.valuationsMap = {};
    this.expandedFactors = {};
    this.totalUIP = 0;
    this.loadMatrices();
  }

  private buildGrid(matriz: Matriz): void {
    this.factors = [];
    this.stages = [];
    this.additionalMap = {};
    this.valuationsMap = {};
    this.expandedFactors = {};

    matriz.items.forEach((item: ItemMatriz) => {
      if (!item.factorSistema || !item.etapa || !item.accionTipo || !item.factorFactor || !item.factorComponente) {
        return;
      }
      const factorKey = `${item.factorSistema}|${item.factorFactor}|${item.factorComponente}`;
      const actionKey = item.accionTipo;
      const uipVal = item.uip ?? 0;

      if (!this.factors.find(f => f.key === factorKey)) {
        this.factors.push({
          sistema: item.factorSistema,
          subsistema: item.factorSubsistema,
          factor: item.factorFactor,
          Componente: item.factorComponente,
          key: factorKey,
          uip: uipVal,
          itemMatrizId: item.id!
        });
      }

      this.valuationsMap[factorKey] = this.valuationsMap[factorKey] || {};
      this.valuationsMap[factorKey][item.etapa] = this.valuationsMap[factorKey][item.etapa] || {};
      this.valuationsMap[factorKey][item.etapa][actionKey] = (item.naturaleza || '').toLowerCase();

      let stageObj = this.stages.find(s => s.name === item.etapa);
      if (!stageObj) {
        stageObj = { name: item.etapa, actions: [] };
        this.stages.push(stageObj);
      }
      if (!stageObj.actions.includes(actionKey)) {
        stageObj.actions.push(actionKey);
      }

      this.additionalMap[factorKey] ||= {};
      this.additionalMap[factorKey][item.etapa] ||= {};
      this.additionalMap[factorKey][item.etapa][actionKey] = { uip: uipVal };
    });

    this.calculateTotalUIP();
    this.factors.sort((a, b) =>
      a.sistema.localeCompare(b.sistema) || a.factor.localeCompare(b.factor)
    );
    this.stages.sort((a, b) => a.name.localeCompare(b.name));
  }

  calculateTotalUIP(): void {
    this.totalUIP = this.factors.reduce((sum, f) => sum + f.uip, 0);
  }

  onFactorUIPChange(factor: FactorView, newValue: number): void {
    factor.uip = newValue;
    const map = this.additionalMap[factor.key];
    for (const st in map) {
      for (const act in map[st]) {
        map[st][act].uip = newValue;
      }
    }
    this.calculateTotalUIP();
  }

  updateUIP(): void {
    this.calculateTotalUIP();
    if (this.totalUIP < this.TOTAL_DISTRIBUCION) {
      Swal.fire('Error', 'El Valor total de UIP debe ser 1.000', 'error');
      return;
    }
    if (this.totalUIP > this.TOTAL_DISTRIBUCION) {
      Swal.fire('Error', `Te pasaste ${this.totalUIP - this.TOTAL_DISTRIBUCION}`, 'error');
      return;
    }
    const updates: ItemUIPUpdateDTO[] = this.factors.map(f => ({ itemId: f.itemMatrizId, uip: f.uip }));
    if (this.selectedMatrix?.id != null) {
      this.matrizService.updateUPI(this.selectedMatrix.id, updates).subscribe(
        () => Swal.fire('Actualizado', 'Valores UIP actualizados.', 'success').then(() => this.backToList()),
        err => { console.error('Error al actualizar UIP:', err); Swal.fire('Error', 'No se pudo actualizar.', 'error'); }
      );
    }
  }

  getUIPAdjustmentMessage(): string {
    const diff = this.totalUIP - this.TOTAL_DISTRIBUCION;
    if (diff > 0) return `Te pasaste ${diff}`;
    if (diff < 0) return `Te faltan ${-diff}`;
    return `Distribución correcta.`;
  }

  shouldShowClasificacion(i: number): boolean {
    return i === 0 || this.factors[i].sistema !== this.factors[i - 1].sistema;
  }

  getRowSpan(i: number): number {
    const cls = this.factors[i].sistema;
    let cnt = 1;
    for (let j = i + 1; j < this.factors.length; j++) {
      if (this.factors[j].sistema === cls) cnt++; else break;
    }
    return cnt;
  }

  isLastFactor(i: number): boolean {
    return i === this.factors.length - 1 || this.factors[i].sistema !== this.factors[i + 1].sistema;
  }

  getFactorClassificationSum(sistema: string): number {
    return this.factors.filter(f => f.sistema === sistema).reduce((sum, f) => sum + f.uip, 0);
  }

 /** Captura y descarga o asocia la tabla UIP según presence de sectionId */
  async onDownloadOrAssociateTable(): Promise<void> {
    const container = this.uipTableVisualizacion.nativeElement;
    if (!container) {
      await Swal.fire('Error', 'No hay elemento para capturar.', 'error');
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const canvas = await html2canvas(container, { scale: 2 });
      const blob: Blob | null = await new Promise(resolve =>
        canvas.toBlob(b => resolve(b), 'image/png')
      );
      if (!blob) throw new Error('No se generó el blob.');
      const fileName = `uip-tabla.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (this.sectionId) {
        // → Asociación al informe
        await this.adjuntosService
          .ploadAdjuntoSeccion(file, 'Tabla UIP', this.sectionId)
          .toPromise();
        this.loading = false;
        this.cdr.detectChanges();
        await Swal.fire('Listo', 'Imagen asociada correctamente.', 'success');
        this.location.back();  // ← Volvemos atrás
      } else {
        // → Descarga local
        this.loading = false;
        this.cdr.detectChanges();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      this.loading = false;
      this.cdr.detectChanges();
      await Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
    }
  }
}
