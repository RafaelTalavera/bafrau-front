// src/app/matriz-causa-efecto-v1-visualizacion/matriz-causa-efecto-v1-visualizacion.component.ts
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { MatrizService } from '../service/matriz-service';
import { Matriz } from '../models/matriz';
import { FactorView, MatrizBuilderUnifiedService, Stage } from '../service/matriz-builder-unified.service';
import { MatrizCausaEfectoV1Component } from '../matriz-causa-efecto-v1/matriz-causa-efecto-v1.component';
import html2canvas from 'html2canvas';



@Component({
  selector: 'app-matriz-causa-efecto-v1-visualizacion',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    HttpClientModule,
    NavComponent,
    FooterComponent,
    MatrizCausaEfectoV1Component 
,
  ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],  
  providers: [
    MatrizService
  ],
  templateUrl: './matriz-causa-efecto-v1-visualizacion.component.html',
  styleUrls: ['./matriz-causa-efecto-v1-visualizacion.component.css']
})
export class MatrizCausaEfectoV1VisualizacionComponent implements OnInit {
  @ViewChild('matrizVisualizacion') matrizVisualizacion!: ElementRef<HTMLDivElement>;
  matrices: Matriz[] = [];
  selectedMatrix: Matriz | null = null;
  factors: FactorView[] = [];
  stages: Stage[] = [];
  valuationsMap: { [key: string]: { [stage: string]: { [action: string]: string } } } = {};
  organizationFilter = '';
  logoBase64 = '';
  editMode = false;
  loadingList: boolean = false;
  loadingDetail: boolean = false;

  constructor(
    private gridService: MatrizBuilderUnifiedService,
    private matrizService: MatrizService,
    private http: HttpClient
  ) {}

    /** Descarga la visualización como JPG */
  downloadAsJpg(): void {
    if (!this.matrizVisualizacion) return;
    html2canvas(this.matrizVisualizacion.nativeElement, { scale: 2 })
      .then(canvas => {
        const link = document.createElement('a');
        link.download = `matriz-${this.selectedMatrix?.id || 'view'}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      })
      .catch(err => {
        console.error('Error capturando la imagen:', err);
        Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
      });
  }

  ngOnInit(): void {
    this.loadMatrices();
    this.loadLogo();
  }

  getOrganization(matrix: Matriz): string {
    return matrix.items?.length
      ? (matrix.items[0].razonSocial || '—')
      : '—';
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
    this.loadingList = true;  // ← comienza
    this.matrizService.getAllMatrices().subscribe(
      data => {
        this.matrices = data.map(m => ({ ...m, razonSocial: m.razonSocial ?? m.organizacionId }));
        this.loadingList = false;  // ← termina
      },
      err => {
        console.error('Error al cargar matrices:', err);
        this.loadingList = false;  // ← asegurar fin
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
  this.loadingDetail = true;
  this.matrizService.getMatrizById(matrix.id).subscribe(
    full => {
      this.selectedMatrix = full;

      // — DEBUG: filtrar ítems con IDs 149-194 —
      const idsProblema = Array.from({ length: 194 - 149 + 1 }, (_, i) => i + 149);
      const faulty = full.items
        .filter(i => idsProblema.includes(i.id))
        .map(({ id, factorSistema, factorSubsistema, factorFactor, factorComponente, etapa, accionTipo, naturaleza }) => ({
          id, factorSistema, factorSubsistema, factorFactor, factorComponente, etapa, accionTipo, naturaleza
        }));
      console.table(faulty);

      this.buildGrid(full);
      this.loadingDetail = false;
    },
    err => {
      console.error('Error al cargar matriz por ID:', err);
      this.loadingDetail = false;
    }
  );
}

  backToList(): void {
    this.selectedMatrix = null;
    this.factors = [];
    this.stages = [];
    this.valuationsMap = {};
    this.editMode = false;
  }

  enableEdit(): void {
    this.editMode = true;
  }

onMatrixSaved(updated: Matriz): void {
  this.matrizService.updateMatriz(updated.id, updated).subscribe(
    () => {
      // 1) Traer la matriz UNA VEZ ACTUALIZADA
      this.matrizService.getMatrizById(updated.id).subscribe(full => {
        this.selectedMatrix = full;
        this.editMode = false;
        this.buildGrid(full);
        Swal.fire('Éxito', 'Matriz actualizada correctamente.', 'success');
      });
    },
    () => Swal.fire('Error', 'No se pudo actualizar la matriz.', 'error')
  );
}


  private buildGrid(matriz: Matriz): void {
    this.logJSON(matriz, 'Ejecutando buildGrid con matriz:');
    const grid = this.gridService.buildGrid(matriz.items);
  
    // **Ahora usamos los factors agrupados**, no volvemos a mapear matriz.items
    this.factors      = grid.factors;
    this.stages       = grid.stages;
    this.valuationsMap= grid.valuationsMap;
  
    this.logJSON(this.factors, 'Factores finales:');
   
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

  // Dentro de MatrizCausaEfectoV1VisualizacionComponent
getItemId(factorId: number, etapa: string, accion: string): number | null {
  const found = this.selectedMatrix?.items.find(i =>
    i.factorId === factorId &&
    i.etapa     === etapa    &&
    i.accionTipo=== accion
  );
  return found ? found.id : null;
}

}
