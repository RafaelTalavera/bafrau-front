import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatrizService } from '../service/matriz-service';
import { ItemMatriz, Matriz } from '../models/matriz';

interface Stage {
  name: string;
  actions: string[];
}

interface FactorView {
  sistema: string;
  subsistema: string;
  factor: string;
  componente: string;
  key: string;
}

@Component({
  selector: 'app-matriz-causa-efecto-v1-visualizacion',
  standalone: true,
  imports: [ FormsModule, CommonModule, NavComponent, FooterComponent, HttpClientModule ],
  templateUrl: './matriz-causa-efecto-v1-visualizacion.component.html',
  styleUrls: ['./matriz-causa-efecto-v1-visualizacion.component.css']
})
export class MatrizCausaEfectoV1VisualizacionComponent implements OnInit {
  matrices: Matriz[] = [];
  selectedMatrix: Matriz | null = null;
  factors: FactorView[] = [];
  stages: Stage[] = [];
  valuationsMap: { [key: string]: { [stage: string]: { [action: string]: string } } } = {};
  organizationFilter = '';
  logoBase64 = '';
  items: ItemMatriz[] = [];

  constructor(private matrizService: MatrizService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMatrices();
    this.loadLogo(); 
  }

  private logJSON(obj: any, mensaje?: string): void {
    console.log(mensaje ?? '', JSON.stringify(obj, null, 2));
  }

  private loadLogo(): void {
    this.http.get('assets/logo_bafrau.base64', { responseType: 'text' }).subscribe({
      next: data => {
        this.logoBase64 = 'data:image/png;base64,' + data;
        this.logJSON(this.logoBase64, 'Logo cargado:');
      },
      error: err => console.error('Error al cargar el logo:', err)
    });
  }

  loadMatrices(): void {
    this.matrizService.getAllMatrices().subscribe(
      data => {
        this.matrices = data.map(m => ({
          ...m,
          razonSocial: m.razonSocial ?? m.organizacionId
        }));
        this.logJSON(this.matrices, 'Matrices cargadas:');
      },
      error => console.error('Error al cargar matrices:', error)
    );
  }

  get filteredMatrices(): Matriz[] {
    const filtro = this.organizationFilter.trim().toLowerCase();
    if (!filtro) {
      return this.matrices;
    }
    return this.matrices.filter(m =>
      m.items.some(item =>
        (item.razonSocial ?? '')
          .toLowerCase()
          .includes(filtro)
      )
    );
  }
  
  viewDetails(matrix: Matriz): void {
    this.matrizService.getMatrizById(matrix.id).subscribe(
      fullMatrix => {
        this.selectedMatrix = fullMatrix;
        this.logJSON(fullMatrix, 'Matriz completa:');
        this.buildGrid(fullMatrix);
      },
      err => console.error('Error al cargar matriz por ID:', err)
    );
  }

  backToList(): void {
    this.selectedMatrix = null;
    this.factors = [];
    this.stages = [];
    this.valuationsMap = {};
  }

  private buildGrid(matriz: Matriz): void {
    this.logJSON(matriz, 'Ejecutando buildGrid con matriz:');
    const factorMap: { [key: string]: FactorView } = {};
    this.stages = [];
    this.valuationsMap = {};

    matriz.items.forEach((item: ItemMatriz) => {
      this.logJSON(item, 'Procesando item:');

      // Usar nuevas propiedades del modelo:
      const etapa         = item.etapa ?? 'N/A';
      const accionTipo    = item.accionTipo ?? 'N/A';
      const sistema       = item.factorSistema ?? 'N/A';
      const subsistema = item.factorSubsistema ?? 'N/A';
      const factorTipo    = item.factorFactor ?? 'N/A';
      const componente    = item.factorComponente ?? 'N/A';
      const naturaleza    = item.naturaleza ?? 'N/A';

      const key = `${sistema}|${subsistema}|${factorTipo}|${componente}`;

      // Agregar factor si no existe
      if (!factorMap[key]) {
        factorMap[key] = { sistema, subsistema, factor: factorTipo, componente, key };
        this.logJSON(factorMap[key], 'Nuevo factor añadido:');
      }

      // Etapa
      let stageObj = this.stages.find(s => s.name === etapa);
      if (!stageObj) {
        stageObj = { name: etapa, actions: [] };
        this.stages.push(stageObj);
        this.logJSON(stageObj, 'Nueva etapa añadida:');
      }
      // Acción
      if (!stageObj.actions.includes(accionTipo)) {
        stageObj.actions.push(accionTipo);
        this.logJSON(accionTipo, `Acción añadida en la etapa ${etapa}:`);
      }

      // Valoraciones
      this.valuationsMap[key]                = this.valuationsMap[key]                || {};
      this.valuationsMap[key][etapa]         = this.valuationsMap[key][etapa]         || {};
      this.valuationsMap[key][etapa][accionTipo] = naturaleza;
      this.logJSON(naturaleza, 'Valoración asignada:');
    });

    // Ordenar y asignar
    this.factors = Object.values(factorMap)
      .sort((a, b) => a.sistema.localeCompare(b.sistema));
    this.stages.sort((a, b) => a.name.localeCompare(b.name));

    this.logJSON(this.factors, 'Factores finales:');
    this.logJSON(this.stages, 'Etapas finales:');
    this.logJSON(this.valuationsMap, 'Mapa de valoraciones:');
  }

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

  getStageClass(stageName: string): string {
    const name = stageName.toLowerCase();
    if (name.includes('construcción')) return 'stage-construccion';
    if (name.includes('operación') || name.includes('funcionamiento')) return 'stage-funcionamiento';
    if (name.includes('abandono') || name.includes('cierre')) return 'stage-abandono';
    if (name.includes('comunes')) return 'stage-comunes';
    return '';
  }

}
