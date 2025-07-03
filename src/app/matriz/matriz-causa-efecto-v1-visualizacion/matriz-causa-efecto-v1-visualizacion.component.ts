// src/app/matriz-causa-efecto-v1-visualizacion/matriz-causa-efecto-v1-visualizacion.component.ts
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
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
import { ActivatedRoute } from '@angular/router';
import { AdjuntosService } from '../../utils/adjuntos.service';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';


@Component({
  selector: 'app-matriz-causa-efecto-v1-visualizacion',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    HttpClientModule,
    NavComponent,
    FooterComponent,
    MatrizCausaEfectoV1Component,
    SpinnerComponent
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
  selectedViewMode: 'complete' | 'stages' | 'systems' | 'combined' | null = null;
  factors: FactorView[] = [];
  stages: Stage[] = [];
  valuationsMap: { [key: string]: { [stage: string]: { [action: string]: string } } } = {};
  organizationFilter = '';
  logoBase64 = '';
  editMode = false;
  loadingList: boolean = false;
  loadingDetail: boolean = false;
  razonSocial?: string;
  sectionId?: number;
  loading: boolean = true;
  public tableSpacingPx = 25;

  //corresponde la visualicíon de opciones de matriz
  fixedStageNames: string[] = [
    'Construcción',
    'Operación y mantenimiento',
    'Comunes',
    'Cierre'
  ];

  constructor(
    private gridService: MatrizBuilderUnifiedService,
    private matrizService: MatrizService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private adjuntosService: AdjuntosService,
    private cdr: ChangeDetectorRef
  ) { }


  ngOnInit(): void {
    this.loading = true;
    this.route.paramMap.subscribe(params => {
      const rs = params.get('razonSocial');
      this.razonSocial = rs ?? undefined;
      this.sectionId = params.get('sectionId') ? +params.get('sectionId')! : undefined;

      if (this.razonSocial) {
        this.loadByRazonSocial(this.razonSocial);
      } else {
        this.loadMatrices();
      }
    });
  }


  async onDownloadOrAssociate(): Promise<void> {
    if (!this.matrizVisualizacion) return;

    this.loading = true;
    this.cdr.detectChanges();

    try {
      const canvas = await html2canvas(this.matrizVisualizacion.nativeElement, { scale: 2 });
      const blob: Blob | null = await new Promise(resolve =>
        canvas.toBlob(b => resolve(b), 'image/png')
      );
      if (!blob) throw new Error('No se generó el blob');
      const file = new File([blob], `matriz-${this.sectionId ?? 'full'}.png`, { type: 'image/png' });

      if (this.sectionId) {
        // Asociación al informe
        await this.adjuntosService.ploadAdjuntoSeccion(file, 'Matriz Causa Efecto', this.sectionId).toPromise();
        // <-- Ocultar spinner antes de la alerta
        this.loading = false;
        this.cdr.detectChanges();
        await Swal.fire('Listo', 'Imagen asociada correctamente', 'success');
      } else {
        // <-- Ocultar spinner antes de la descarga
        this.loading = false;
        this.cdr.detectChanges();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'matriz.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      this.loading = false;
      this.cdr.detectChanges();
      await Swal.fire('Error', 'No se pudo generar la imagen', 'error');
    }
  }


  getOrganization(matrix: Matriz): string {
    return matrix.items?.length
      ? (matrix.items[0].razonSocial || '—')
      : '—';
  }

  private loadByRazonSocial(razon: string): void {
    this.matrizService.getAllMatrices().subscribe({
      next: data => {
        this.matrices = data
          .filter(m =>
            (m.razonSocial ?? '').toLowerCase() === razon.toLowerCase()
          )
          .map(m => ({
            ...m,
            razonSocial: m.razonSocial ?? m.organizacionId
          }));
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  private logJSON(obj: any, mensaje?: string): void {
    console.log(mensaje ?? '', JSON.stringify(obj, null, 2));
  }


  private loadMatrices(): void {
    this.matrizService.getAllMatrices().subscribe({
      next: data => {
        this.matrices = data.map(m => ({
          ...m,
          razonSocial: m.razonSocial ?? m.organizacionId
        }));
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
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
        this.selectedViewMode = null; // reinicia selector de vista

        // — DEBUG: filtrar ítems con IDs 149–194 —
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
    this.selectedViewMode = null;
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
    this.factors = grid.factors;
    this.stages = grid.stages;
    this.valuationsMap = grid.valuationsMap;

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
      i.etapa === etapa &&
      i.accionTipo === accion
    );
    return found ? found.id : null;
  }

  /** Descarga la visualización como JPG */
  downloadAsJpg(): void {
    if (!this.matrizVisualizacion) return;
    // 1) Arranca el spinner

    html2canvas(this.matrizVisualizacion.nativeElement, { scale: 2 })
      .then(canvas => {
        // 2) Descarga la imagen
        const link = document.createElement('a');
        link.download = `matriz-${this.selectedMatrix?.id || 'view'}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        // 3) Para el spinner

      })
      .catch(err => {
        console.error('Error capturando la imagen:', err);
        // 4) Para el spinner y mensaje de error

        Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
      });
  }

  /** Descarga una tabla puntual como PNG */
  downloadTable(container: HTMLElement, label: string): void {
    html2canvas(container, { scale: 2 })
      .then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `matriz-${label}.png`;
        link.click();
      })
      .catch(err => {
        console.error('Error descargando tabla:', err);
        Swal.fire('Error', 'No se pudo descargar la tabla.', 'error');
      });
  }


  // agregado para poder visualizar la matriz con varias opciones. 

  resetViewMode(): void {
    this.selectedViewMode = null;
  }



  setViewMode(mode: 'complete' | 'stages' | 'systems' | 'combined'): void {
    this.selectedViewMode = mode;
  }


  getStageByName(name: string): Stage | undefined {
    return this.stages.find(st =>
      st.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /** Lista de sistemas únicos, en el orden que aparecen */
  get uniqueSystems(): string[] {
    return Array.from(new Set(this.factors.map(f => f.sistema)));
  }

  /** Devuelve sólo los factores de un sistema dado */
  getFactorsBySystem(system: string): FactorView[] {
    return this.factors.filter(f => f.sistema === system);
  }





}
