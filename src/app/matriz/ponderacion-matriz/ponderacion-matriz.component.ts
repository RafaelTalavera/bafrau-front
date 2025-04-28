import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import Swal from 'sweetalert2';
import { ItemMatriz, Matriz } from '../models/matriz';
import { MatrizService } from '../service/matriz-service';

export interface AdditionalFields {
  uIP: number;
}

interface Stage {
  name: string;
  actions: string[];
}

interface FactorView {
  clasificacion: string;
  factor: string;
  factorComponente: string;
  key: string;
  uIP: number;
  itemMatrizId: number;
}

export interface ItemUIPUpdateDTO {
  factorId: number;
  factor: string;
  uIP: number;
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
  organizationFilter: string = '';
  expandedFactors: { [key: string]: boolean } = {};
  totalUIP: number = 0;
  readonly TOTAL_DISTRIBUCION = 1000;

  constructor(private matrizService: MatrizService) { }

  ngOnInit(): void {
    this.loadMatrices();
  }

  loadMatrices(): void {
    this.matrizService.getAllMatrices().subscribe(
      data => this.matrices = data,
      error => console.error('Error al cargar matrices:', error)
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
  }

  private buildGrid(matriz: Matriz): void {
    this.factors = [];
    this.stages = [];
    this.additionalMap = {};
    this.valuationsMap = {};
    this.expandedFactors = {};

    matriz.items.forEach((item: ItemMatriz) => {
      if (!item.factorMedio || !item.etapa || !item.accionTipo || !item.factorFactor || !item.factorComponente) {
        return;
      }

      const factorKey = `${item.factorMedio}|${item.factorFactor}|${item.factorComponente}`;
      const actionKey = item.accionTipo; // <-- ahora usamos el string

      if (!this.factors.find(f => f.key === factorKey)) {
        this.factors.push({
          clasificacion: item.factorMedio,
          factor: item.factorFactor,
          factorComponente: item.factorComponente,
          key: factorKey,
          uIP: 0,
          itemMatrizId: item.factorId!
        });
      }

      // Naturaleza
      this.valuationsMap[factorKey] = this.valuationsMap[factorKey] || {};
      this.valuationsMap[factorKey][item.etapa] = this.valuationsMap[factorKey][item.etapa] || {};
      this.valuationsMap[factorKey][item.etapa][actionKey] = (item.naturaleza || '').toLowerCase();

      // Stages y acciones
      let stageObj = this.stages.find(s => s.name === item.etapa);
      if (!stageObj) {
        stageObj = { name: item.etapa, actions: [] };
        this.stages.push(stageObj);
      }
      if (!stageObj.actions.includes(actionKey)) {
        stageObj.actions.push(actionKey);
      }

      // Valores UIP
      this.additionalMap[factorKey] = this.additionalMap[factorKey] || {};
      this.additionalMap[factorKey][item.etapa] = this.additionalMap[factorKey][item.etapa] || {};
      this.additionalMap[factorKey][item.etapa][actionKey] = { uIP: item.uIP! };
    });

    // Ordenar
    this.factors.sort((a, b) =>
      a.clasificacion.localeCompare(b.clasificacion) || a.factor.localeCompare(b.factor)
    );
    this.stages.sort((a, b) => a.name.localeCompare(b.name));

    // Asignar UIP a cada factor
    this.factors.forEach(factor => {
      const map = this.additionalMap[factor.key];
      for (const st in map) {
        for (const act in map[st]) {
          factor.uIP = map[st][act].uIP;
          break;
        }
      }
    });
  }

  calculateTotalUIP(): void {
    this.totalUIP = this.factors.reduce((sum, f) => sum + f.uIP, 0);
  }

  getUIPAdjustmentMessage(): string {
    const diff = this.totalUIP - this.TOTAL_DISTRIBUCION;
    if (diff > 0) return `Te pasaste, debes restar ${diff}`;
    if (diff < 0) return `Te faltan, debes sumar ${-diff}`;
    return `La distribución es correcta.`;
  }

  onFactorUIPChange(factor: FactorView, newValue: number): void {
    factor.uIP = newValue;
    const map = this.additionalMap[factor.key];
    for (const st in map) {
      for (const act in map[st]) {
        map[st][act].uIP = newValue;
      }
    }
    this.calculateTotalUIP();
  }

  updateUIP(): void {
    this.calculateTotalUIP();
    if (this.totalUIP !== this.TOTAL_DISTRIBUCION) {
      Swal.fire('Error', `La suma total de UIP debe ser ${this.TOTAL_DISTRIBUCION}. Actualmente es ${this.totalUIP}.`, 'error');
      return;
    }

    const updates: ItemUIPUpdateDTO[] = this.factors.map(f => ({
      factorId: f.itemMatrizId,
      factor: f.factor,
      uIP: f.uIP
    }));

    if (this.selectedMatrix?.id != null) {
      this.matrizService.updateUPI(this.selectedMatrix.id, updates).subscribe(
        () => Swal.fire('Actualizado', 'Valor UIP actualizado correctamente.', 'success'),
        err => {
          console.error('Error al actualizar UIP:', err);
          Swal.fire('Error', 'No se pudo actualizar el valor UIP.', 'error');
        }
      );
    }
  }

  shouldShowClasificacion(index: number): boolean {
    return index === 0
      ? true
      : this.factors[index].clasificacion !== this.factors[index - 1].clasificacion;

  }

  getRowSpan(index: number): number {
    const cls = this.factors[index].clasificacion;
    let count = 1;
    for (let i = index + 1; i < this.factors.length; i++) {
      if (this.factors[i].clasificacion === cls) count++;
      else break;
    }
    return count;
  }

  isLastFactor(index: number): boolean {
    return (
      index === this.factors.length - 1 ||
      this.factors[index].clasificacion !== this.factors[index + 1].clasificacion
    );
  }

  getFactorClassificationSum(clasificacion: string): number {
    return this.factors
      .filter(f => f.clasificacion === clasificacion)
      .reduce((sum, f) => sum + f.uIP, 0);
  }

}