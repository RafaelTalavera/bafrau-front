import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import Swal from 'sweetalert2';
import { ItemMatriz, Matriz } from '../models/matriz';
import { MatrizService } from '../service/matriz-service';

export interface AdditionalFields {
  uip: number;
}

interface Stage {
  name: string;
  actions: string[];
}

interface FactorView {
  sistema: string;
  subsistema: string;
  factor: string;
  Componente: string;
  key: string;
  uip: number;
  itemMatrizId: number;
}

export interface ItemUIPUpdateDTO {
  itemId: number;
  uip: number;
}

@Component({
  selector: 'app-ponderacion-matriz',
  standalone: true,
  imports: [FormsModule, CommonModule, NavComponent, FooterComponent],
  templateUrl: './ponderacion-matriz.component.html',
  styleUrls: ['./ponderacion-matriz.component.css']
})
export class PonderacionMatrizComponent implements OnInit {
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

  constructor(private matrizService: MatrizService) { }

  ngOnInit(): void {
    this.loadMatrices();
  }

  loadMatrices(): void {
    this.matrizService.getAllMatrices().subscribe(
      data => this.matrices = data,
      err => console.error('Error al cargar matrices:', err)
    );
  }

  get filteredMatrices(): Matriz[] {
    const filtro = this.organizationFilter.trim().toLowerCase();
    if (!filtro) {
      return this.matrices;
    }
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
      const uipVal = item.uip == null ? 0 : item.uip;

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

    // Recalcular UIP tras construir la grilla
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
    if (this.totalUIP !== this.TOTAL_DISTRIBUCION) {
      Swal.fire('Error', `La suma total debe ser ${this.TOTAL_DISTRIBUCION}. Actualmente es ${this.totalUIP}.`, 'error');
      return;
    }

    const updates: ItemUIPUpdateDTO[] = this.factors.map(f => ({
      itemId: f.itemMatrizId,
      uip: f.uip
    }));

    if (this.selectedMatrix?.id != null) {
      this.matrizService.updateUPI(this.selectedMatrix.id, updates).subscribe(
        () => {
          Swal.fire('Actualizado', 'Valores UIP actualizados.', 'success')
            .then(() => this.backToList()); // ← tras cerrar el diálogo, recarga
        },
        err => {
          console.error('Error al actualizar UIP:', err);
          Swal.fire('Error', 'No se pudo actualizar.', 'error');
        }
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
      if (this.factors[j].sistema === cls) cnt++;
      else break;
    }
    return cnt;
  }

  isLastFactor(i: number): boolean {
    return i === this.factors.length - 1 || this.factors[i].sistema !== this.factors[i + 1].sistema;
  }

  getFactorClassificationSum(sistema: string): number {
    return this.factors.filter(f => f.sistema === sistema)
      .reduce((sum, f) => sum + f.uip, 0);
  }
}
