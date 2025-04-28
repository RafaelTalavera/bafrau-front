import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatrizService } from '../service/matriz-service';
import { ItemMatriz, Matriz } from '../models/matriz';

interface Stage {
  name: string;
  actions: string[];
}

interface FactorView {
  clasificacion: string;
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
    if (!this.organizationFilter.trim()) return this.matrices;
    return this.matrices.filter(m =>
      (m.razonSocial || '').toLowerCase().includes(this.organizationFilter.toLowerCase())
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
      const clasificacion = item.factorMedio ?? 'N/A';
      const factorTipo    = item.factorFactor ?? 'N/A';
      const componente    = item.factorComponente ?? 'N/A';
      const naturaleza    = item.naturaleza ?? 'N/A';

      const key = `${clasificacion}|${factorTipo}|${componente}`;

      // Agregar factor si no existe
      if (!factorMap[key]) {
        factorMap[key] = { clasificacion, factor: factorTipo, componente, key };
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
      .sort((a, b) => a.clasificacion.localeCompare(b.clasificacion));
    this.stages.sort((a, b) => a.name.localeCompare(b.name));

    this.logJSON(this.factors, 'Factores finales:');
    this.logJSON(this.stages, 'Etapas finales:');
    this.logJSON(this.valuationsMap, 'Mapa de valoraciones:');
  }

  shouldShowClasificacion(index: number): boolean {
    return index === 0 || this.factors[index].clasificacion !== this.factors[index - 1].clasificacion;
  }

  getRowSpan(index: number): number {
    let count = 1;
    const current = this.factors[index].clasificacion;
    for (let i = index + 1; i < this.factors.length; i++) {
      if (this.factors[i].clasificacion === current) count++;
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

  exportarExcel(): void {
    if (!this.selectedMatrix) return;
    const exportData: any[][] = [
      ['Matriz Causa-Efecto'],
      ['Fecha:', this.selectedMatrix.fecha],
      ['Organización:', this.selectedMatrix.razonSocial],
      [],
    ];

    const headerRow1: any[] = ['Clasificación', 'Factor', 'Componente'];
    const headerRow2: any[] = ['', '', ''];
    this.stages.forEach(stage => {
      headerRow1.push({ content: stage.name, colSpan: stage.actions.length, styles: { halign: 'center' } });
      for (let i = 1; i < stage.actions.length; i++) {
        headerRow1.push('');
      }
      stage.actions.forEach(action => headerRow2.push(action));
    });
    exportData.push(headerRow1, headerRow2);

    this.factors.forEach(factor => {
      const row = [factor.clasificacion, factor.factor, factor.componente];
      this.stages.forEach(stage => {
        stage.actions.forEach(action => {
          row.push(this.valuationsMap[factor.key]?.[stage.name]?.[action] || 'N/A');
        });
      });
      exportData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Rango de cabeceras
    const mergeRanges: { s: { r: number, c: number }, e: { r: number, c: number } }[] = [];
    const headerStart = exportData.findIndex(row => row === headerRow1);
    let colIndex = 3;
    this.stages.forEach(stage => {
      if (stage.actions.length > 1) {
        mergeRanges.push({
          s: { r: headerStart, c: colIndex },
          e: { r: headerStart, c: colIndex + stage.actions.length - 1 }
        });
      }
      colIndex += stage.actions.length;
    });

    // Rango de clasificaciones
    const mergeClassificationRanges: { s: { r: number, c: number }, e: { r: number, c: number } }[] = [];
    const factorStart = headerStart + 2;
    let currentStart = factorStart;
    for (let r = factorStart + 1; r < exportData.length; r++) {
      if (exportData[r][0] !== exportData[currentStart][0]) {
        if (r - 1 > currentStart) {
          mergeClassificationRanges.push({
            s: { r: currentStart, c: 0 },
            e: { r: r - 1, c: 0 }
          });
        }
        currentStart = r;
      }
    }
    if (exportData.length - 1 > currentStart) {
      mergeClassificationRanges.push({
        s: { r: currentStart, c: 0 },
        e: { r: exportData.length - 1, c: 0 }
      });
    }

    ws['!merges'] = [...mergeRanges, ...mergeClassificationRanges];

    // Colorear celdas
    for (let r = headerStart + 3; r < exportData.length; r++) {
      for (let c = 0; c < exportData[r].length; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellAddress];
        if (cell && typeof cell.v === 'string') {
          if (cell.v === 'positivo') {
            cell.s = { fill: { fgColor: { rgb: "C6EFCE" } } };
          } else if (cell.v === 'negativo') {
            cell.s = { fill: { fgColor: { rgb: "FFC7CE" } } };
          } else if (cell.v === 'neutro') {
            cell.s = { fill: { fgColor: { rgb: "FFEB9C" } } };
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz');
    XLSX.writeFile(wb, 'MatrizCausaEfecto.xlsx');
  }

  exportarPDF(): void {
    if (!this.selectedMatrix) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    doc.setFontSize(14);
    doc.text("Matriz Causa-Efecto", 14, currentY);
    doc.setFontSize(12);
    currentY += 10;
    doc.text("ID: " + this.selectedMatrix.id, 14, currentY);
    currentY += 10;
    doc.text("Fecha: " + this.selectedMatrix.fecha, 14, currentY);
    currentY += 10;
    doc.text("Organización: " + this.selectedMatrix.razonSocial, 14, currentY);
    if (this.selectedMatrix.direccion) {
      currentY += 10;
      doc.text("Dirección: " + this.selectedMatrix.direccion, 14, currentY);
    }
    if (this.selectedMatrix.rubro) {
      currentY += 10;
      doc.text("Rubro: " + this.selectedMatrix.rubro, 14, currentY);
    }

    // Preparar cabeceras
    const header: any[] = [];
    const headerRow1: any[] = [
      { content: 'Clasificación', rowSpan: 2, styles: { halign: 'center' } },
      { content: 'Factor', rowSpan: 2, styles: { halign: 'center' } },
      { content: 'Componente', rowSpan: 2, styles: { halign: 'center' } }
    ];
    this.stages.forEach(stage => {
      headerRow1.push({ content: stage.name, colSpan: stage.actions.length, styles: { halign: 'center' } });
    });
    header.push(headerRow1);

    const headerRow2: any[] = [];
    this.stages.forEach(stage => {
      stage.actions.forEach(action => {
        headerRow2.push({ content: action, styles: { halign: 'center' } });
      });
    });
    header.push(headerRow2);

    // Cuerpo
    const body = this.factors.map(factor => {
      const row = [factor.clasificacion, factor.factor, factor.componente];
      this.stages.forEach(stage => {
        stage.actions.forEach(action => {
          row.push(this.valuationsMap[factor.key]?.[stage.name]?.[action] || 'N/A');
        });
      });
      return row;
    });

    autoTable(doc, {
      startY: currentY + 10,
      head: header,
      body: body,
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.cell.raw === 'positivo') {
            data.cell.styles.fillColor = [198, 239, 206];
          } else if (data.cell.raw === 'negativo') {
            data.cell.styles.fillColor = [255, 199, 206];
          } else if (data.cell.raw === 'neutro') {
            data.cell.styles.fillColor = [255, 235, 156];
          }
        }
      },
      didDrawPage: () => {
        if (this.logoBase64) {
          doc.addImage(this.logoBase64, 'PNG', pageWidth - 40, 10, 30, 15);
        }
      }
    });

    doc.save('MatrizCausaEfecto.pdf');
  }
}
