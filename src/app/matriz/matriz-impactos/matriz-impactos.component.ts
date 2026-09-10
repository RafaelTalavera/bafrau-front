import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import Swal from 'sweetalert2';
import { Chart, ChartDataset, registerables } from 'chart.js';
import { ItemMatriz, Matriz } from '../models/matriz';
import { MatrizService } from '../service/matriz-service';
import { AdditionalFieldOptions } from '../constants/additional-flied-options';
import { ActivatedRoute, Router } from '@angular/router';
import { AdditionalFields, FactorView, MatrizBuilderUnifiedService, Stage } from '../service/matriz-builder-unified.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AdjuntosService } from '../../utils/adjuntos.service';
import { SpinnerComponent } from "../../utils/spinner/spinner.component";
import { Location } from '@angular/common';

import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables);

interface FactorSummary {
  factor: string;
  componente: string;
  irt: number;
  actions: string[];
}

interface ActionIRTSummary {
  etapa: string;
  accion: string;
  irt: number;
}


@Component({
  selector: 'app-matriz-impactos',
  standalone: true,
  imports: [FormsModule, CommonModule, NavComponent, FooterComponent, SpinnerComponent],
  templateUrl: './matriz-impactos.component.html',
  styleUrls: ['./matriz-impactos.component.css']
})
export class MatrizImpactosComponent implements OnInit, AfterViewInit {
  matrices: Matriz[] = [];
  selectedMatrix: Matriz | null = null;

  @ViewChild('matrizVisualizacion', { static: false })
  matrizVisualizacion!: ElementRef<HTMLDivElement>;

  factors: FactorView[] = [];
  stages: Stage[] = [];
  valuationsMap: Partial<Record<string,
    Partial<Record<string, Partial<Record<string, string>>>>>> = {};
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
  topThreeActionPosIRTs: ActionIRTSummary[] = [];
  topThreeActionNegIRTs: ActionIRTSummary[] = [];
  irtChart?: Chart;
  actionsChart?: Chart;

  // ← Banderas de carga
  loadingList: boolean = false;
  loadingDetail: boolean = false;

  //bandera spinnig
  //ropiedad para controlar spinners de descarga
  loadingDownloads: Record<string, boolean> = {};

  razonSocial?: string;
  sectionId?: number;

  pieChart?: Chart; 

  @ViewChild('irtBarChart') irtBarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('irtActionsChart') irtActionsChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('factorsCanvas',      { static: false }) factorsChartRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('actionsOnlyCanvas',  { static: false }) actionsOnlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('actionsByStageCanvas',{ static: false }) actionsByStageChartRef!:ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas',          { static: false }) pieChartRef!:        ElementRef<HTMLCanvasElement>;  

  factorsChart?: Chart;
  actionsOnlyChart?: Chart;
  actionsByStageChart?: Chart;

  loading: boolean = false;


  /** Plugin para pintar fondo blanco detrás de cada gráfico */
  private whiteBgPlugin = {
    id: 'whiteBackground',
    beforeDraw: (chart: any) => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    }
  };


  constructor(
    private router: Router,
    private matrizService: MatrizService,
    private gridBuilder: MatrizBuilderUnifiedService,
    private route: ActivatedRoute,
    private adjuntosService: AdjuntosService,
    private cdr: ChangeDetectorRef,
    private location: Location,
  ) { }


/**
 * Descarga o asocia cualquier gráfico de Chart.js como imagen PNG.
 */
/**
 * Descarga o asocia cualquier gráfico de Chart.js como imagen PNG.
 */
async onDownloadOrAssociateChart(
  chart: Chart | undefined,
  filename: string,
  titleForAssoc: string
): Promise<void> {
  if (!chart) {
    await Swal.fire('Error', 'No hay gráfico para capturar.', 'error');
    return;
  }

  this.loading = true;
  this.cdr.detectChanges();

  try {
    let dataUrl: string;

    if (filename === 'grafico-distribucion-impactos') {
      const titles = Array.from(
        document.querySelectorAll<HTMLElement>('.card.chart-card h3')
      );
      const targetTitle = titles.find(
        (el) => (el.textContent || '').trim().toLowerCase() === 'distribución de impactos'
      );

      if (targetTitle) {
        const cardEl = targetTitle.closest('.card.chart-card') as HTMLElement | null;

        if (cardEl) {
          // 🔒 Ocultar barra de botones (y cualquier botón) sólo durante la captura
          const toHide: HTMLElement[] = [
            ...Array.from(cardEl.querySelectorAll<HTMLElement>('.d-flex.justify-content-center.mb-2')),
            ...Array.from(cardEl.querySelectorAll<HTMLElement>('button'))
          ];
          const prevDisplay = toHide.map(el => el.style.display);
          toHide.forEach(el => el.style.display = 'none');

          try {
            const cardRect = cardEl.getBoundingClientRect();
            const titleRect = targetTitle.getBoundingClientRect();
            const cropY = Math.max(
              0,
              Math.round(titleRect.top - cardRect.top + cardEl.scrollTop)
            );
            const height = Math.ceil(cardEl.scrollHeight - cropY);

            const canvas = await html2canvas(cardEl, {
              y: cropY,
              height,
              backgroundColor: '#ffffff',
              useCORS: true,
              scale: Math.max(2, window.devicePixelRatio || 1),
            });

            dataUrl = canvas.toDataURL('image/png');
          } finally {
            // 🔓 Restaurar visibilidad
            toHide.forEach((el, i) => (el.style.display = prevDisplay[i]));
          }
        } else {
          dataUrl = chart.toBase64Image('image/png', 1.0);
        }
      } else {
        dataUrl = chart.toBase64Image('image/png', 1.0);
      }
    } else {
      dataUrl = chart.toBase64Image('image/png', 1.0);
    }

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `${filename}.png`, { type: 'image/png' });

    if (this.sectionId) {
      await this.adjuntosService
        .ploadAdjuntoSeccion(file, titleForAssoc, this.sectionId)
        .toPromise();

      await Swal.fire('Listo', `${titleForAssoc} asociado correctamente.`, 'success');
      this.location.back();
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  } catch (err) {
    console.error(err);
    await Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
}




/**
 * Descarga o asocia la captura de una tabla según presence de sectionId.
 */
async onDownloadOrAssociateTable(
  container: HTMLElement,
  label: string
): Promise<void> {
  if (!container) {
    await Swal.fire('Error', 'No hay elemento para capturar.', 'error');
    return;
  }

  // 1) Mostrar spinner para este label
  this.loadingDownloads[label] = true;
  this.cdr.detectChanges();

  try {
    // 2) Captura a canvas
    const canvas = await html2canvas(container, { scale: 2 });
    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(b => resolve(b), 'image/png')
    );
    if (!blob) throw new Error('No se generó el blob.');

    const fileName = `matriz-${label}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    if (this.sectionId) {
      // 3a) Asociación al informe
      await this.adjuntosService
        .ploadAdjuntoSeccion(file, 'Matriz Impactos', this.sectionId)
        .toPromise();

      // 4a) Mostrar éxito
      await Swal.fire('Listo', 'Imagen asociada correctamente.', 'success');

      // 5) Volver a la vista anterior (construcción de informe)
      this.location.back();

    } else {
      // 3b) Descarga local
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error(err);
    await Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
  } finally {
    // 6) Ocultar spinner
    this.loadingDownloads[label] = false;
    this.cdr.detectChanges();
  }
}


  //Botón de descarga -->
  /** Descarga JPG o lo asocia según sectionId */
  downloadAsJpg(): void {
    if (!this.matrizVisualizacion) return;
    const el = this.matrizVisualizacion.nativeElement;

    // (Opcional) ajusta estilos si es necesario...
    html2canvas(el, { scale: 2 })
      .then(canvas => canvas.toBlob(blob => {
        if (!blob) return;
        const fileName = `matriz-${this.sectionId || 'view'}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        if (this.sectionId) {
          // Modo “asociar”
          this.adjuntosService
            .ploadAdjuntoSeccion(file, 'Matriz Impactos', this.sectionId)
            .subscribe({
              next: () =>
                Swal.fire('Éxito', 'Imagen asociada correctamente', 'success'),
              error: () =>
                Swal.fire('Error', 'No se pudo asociar la imagen', 'error'),
            });
        } else {
          // Modo descarga
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/jpeg', 0.9);
          a.download = fileName;
          a.click();
        }
      }))
      .catch(err => {
        console.error('Error generando JPG:', err);
        Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
      });
  }

/** Descarga o asocia el gráfico IRT como JPG */
downloadIrtChart(): void {
  if (!this.irtChart) return;
  const dataUrl = this.irtChart.toBase64Image('image/jpeg', 0.9);

  fetch(dataUrl)
    .then(res => res.blob())
    .then(blob => {
      const fileName = `grafico-factor-componente-${this.selectedMatrix?.id || 'view'}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      if (this.sectionId) {
        this.adjuntosService
          .ploadAdjuntoSeccion(file, 'Gráfico IRT', this.sectionId)
          .subscribe({
            next: () => {
              // Mostramos éxito y, al cerrar, volvemos atrás
              Swal.fire('Listo', 'Gráfico IRT asociado correctamente', 'success')
                .then(() => {
                  // Opción A: usar Location.back()
                  // this.location.back();

                  // Opción B: usar el historial del navegador
                  window.history.back();
                });
            },
            error: () =>
              Swal.fire('Error', 'No se pudo asociar el gráfico IRT', 'error'),
          });
      } else {
        // Descarga local
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.click();
      }
    })
    .catch(err => {
      console.error('Error generando gráfico IRT:', err);
      Swal.fire('Error', 'No se pudo generar el gráfico IRT.', 'error');
    });
}

  /** Descarga o asocia el gráfico de Acciones como JPG */
  downloadActionsChart(): void {
    if (!this.actionsChart) return;
    const dataUrl = this.actionsChart.toBase64Image('image/jpeg', 0.9);
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const fileName = `grafico-acciones-factor-${this.selectedMatrix?.id || 'view'}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        if (this.sectionId) {
          this.adjuntosService
            .ploadAdjuntoSeccion(file, 'Gráfico Acciones', this.sectionId)
            .subscribe({
              next: () =>
                Swal.fire('Listo', 'Gráfico de acciones asociado correctamente', 'success'),
              error: () =>
                Swal.fire('Error', 'No se pudo asociar el gráfico de acciones', 'error'),
            });
        } else {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = fileName;
          a.click();
        }
      })
      .catch(err => {
        console.error('Error generando gráfico de acciones:', err);
        Swal.fire('Error', 'No se pudo generar el gráfico de acciones.', 'error');
      });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const rs = params.get('razonSocial');
      const sid = params.get('sectionId');
      this.razonSocial = rs ?? undefined;
      this.sectionId = sid ? +sid : undefined;

      if (this.razonSocial) {
        this.loadByRazonSocial(this.razonSocial);
      } else {
        this.loadMatrices();
      }
    });

  }

  private loadByRazonSocial(razon: string): void {
    console.log('▶️ loadByRazonSocial con razonSocial =', razon);
    this.loadingList = true;
    this.matrizService.getAllMatrices().subscribe({
      next: data => {
        this.matrices = data
          .filter(m => (m.razonSocial ?? '').toLowerCase() === razon.toLowerCase())
          .map(m => ({ ...m, razonSocial: m.razonSocial ?? m.organizacionId }));
        console.log('📋 matrices filtradas:', this.matrices);
        this.loadingList = false;
      },
      error: err => {
        console.error('❌ Error al cargar por razonSocial:', err);
        this.loadingList = false;
      }
    });
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
    // 1) Reiniciar resúmenes de factores
    this.topThreePosIRTs = [];
    this.topThreeNegIRTs = [];

    // 1.1) Reiniciar resúmenes de acciones
    this.topThreeActionPosIRTs = [];  // ← NUEVO
    this.topThreeActionNegIRTs = [];  // ← NUEVO

    // 2) Obtener datos del servicio (ya vienen ordenados)
    const items = matriz.items;
    const { factors, stages, valuationsMap, additionalMap } =
      this.gridBuilder.buildGrid(items);

    // 3) Asignar directamente
    this.factors = factors;
    this.stages = stages;
    this.valuationsMap = valuationsMap;
    this.additionalMap = additionalMap;

    // 4) Inicializar desplegado
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

    // 6.1) Calcular top 3 por acción y etapa (positivos y negativos)
    this.computeTopThreeActionIRTs();  // este método ahora llena ambos arrays

setTimeout(() => {
  this.createBarChart();
  this.createBarChartActions();
  this.createFactorsChart();
  this.createActionsOnlyChart();

  // ❌ Antes:
// this.createActionsByStageChart();

  // ✅ Ahora:
  if (this.actionsByStageChartRef?.nativeElement && this.shouldShowActionsByStageChart()) {
    this.createActionsByStageChart();
  }

  // Retrasa el pie chart hasta que Angular renderice el <canvas>
  setTimeout(() => this.createPieChart(), 0);
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
      id: item.id,
      etapa: item.etapa,
      intensidad: item.intensidad,
      extension: item.extension,
      momento: item.momento,
      persistencia: item.persistencia,
      reversivilidad: item.reversivilidad,
      sinergia: item.sinergia,
      acumulacion: item.acumulacion,
      efecto: item.efecto,
      periodicidad: item.periodicidad,
      recuperacion: item.recuperacion,
      uip: item.uip,
      magnitude: item.magnitude,
      importance: item.importance
    }));
  }


  showNumericPopup(): void {
    if (!this.selectedMatrix) {
      Swal.fire('Atención', 'No hay ninguna matriz seleccionada.', 'warning');
      return;
    }

    // 1) Orden de etapas
    const etapaOrder = [
      'Construcción',
      'Operación y mantenimiento',
      'Cierre',
      'Comunes'
    ];

    // 2) Clonar y ordenar items
    const sortedItems = [...this.selectedMatrix.items].sort((a, b) => {
      const ia = etapaOrder.indexOf(a.etapa);
      const ib = etapaOrder.indexOf(b.etapa);
      return (ia - ib) || 0;
    });

    // 3) Generar filas
    const rows = sortedItems.map(item => `
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
    <div id="numericTable"
         style="overflow:auto; max-height:60vh; max-width:95vw; font-size:10px;">
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
      confirmButtonText: 'Cerrar',
      footer: '<button id="downloadPdf" class="swal2-confirm swal2-styled">Descargar PDF</button>',
      didRender: () => {
        document.getElementById('downloadPdf')?.addEventListener('click', () => {
          const el = document.getElementById('numericTable')!;
          // Guardar estilos originales
          const orig = {
            height: el.style.height,
            width: el.style.width,
            maxHeight: el.style.maxHeight,
            maxWidth: el.style.maxWidth,
            overflow: el.style.overflow
          };
          // Expandir contenido
          el.style.height = el.scrollHeight + 'px';
          el.style.width = el.scrollWidth + 'px';
          el.style.maxHeight = 'none';
          el.style.maxWidth = 'none';
          el.style.overflow = 'visible';

          html2canvas(el, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'pt', 'a4');
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();
            const margin = 40;                  // margen en pts
            const pageH = pdfH - margin * 2;   // altura útil en pts
            const imgW = pdfW - margin * 2;
            const imgH = (canvas.height * imgW) / canvas.width;
            const pxPerPt = canvas.width / imgW; // ratio px/pt
            const slicePx = pageH * pxPerPt;

            const logo = new Image();
            logo.src = 'assets/dist/img/logo-letras.png';
            logo.onload = () => {
              const logoW = 60; // ancho en pts
              const logoH = (logo.height / logo.width) * logoW;
              let remainingPt = imgH;
              let srcYpx = 0;

              while (remainingPt > 0) {
                // 1) Logo arriba a la derecha
                pdf.addImage(
                  logo,
                  'PNG',
                  pdfW - margin - logoW,
                  margin / 2,
                  logoW,
                  logoH
                );
                // 2) Slice de tabla
                const hPx = Math.min(slicePx, canvas.height - srcYpx);
                const sliceCanv = document.createElement('canvas');
                sliceCanv.width = canvas.width;
                sliceCanv.height = hPx;
                const ctx = sliceCanv.getContext('2d')!;
                ctx.drawImage(canvas, 0, srcYpx, canvas.width, hPx, 0, 0, canvas.width, hPx);
                const sliceData = sliceCanv.toDataURL('image/png');
                const slicePt = hPx / pxPerPt;

                // 3) Pintar slice debajo del logo
                pdf.addImage(
                  sliceData,
                  'PNG',
                  margin,
                  margin + logoH + 10,
                  imgW,
                  slicePt
                );

                remainingPt -= pageH;
                srcYpx += hPx;
                if (remainingPt > 0) pdf.addPage();
              }

              pdf.save(`matriz-numerica-${this.selectedMatrix!.id}.pdf`);
            };
          }).catch(err => {
            console.error(err);
            Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
          }).finally(() => {
            // Restaurar estilos originales
            el.style.height = orig.height;
            el.style.width = orig.width;
            el.style.maxHeight = orig.maxHeight;
            el.style.maxWidth = orig.maxWidth;
            el.style.overflow = orig.overflow;
          });
        });
      }
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
            i.factorId === f.id &&
            i.etapa === st.name &&
            i.accionTipo === action
          );
          if (!item) return;

          // asignar valores…
          item.intensidad = add.intensidad;
          item.extension = add.extension;
          item.momento = add.momento;
          item.persistencia = add.persistencia;
          item.reversivilidad = add.reversibilidad;
          item.sinergia = add.sinergia;
          item.acumulacion = add.acumulacion;
          item.efecto = add.efecto;
          item.periodicidad = add.periodicidad;
          item.recuperacion = add.recuperacion;
          item.uip = add.uip;

          // recalcular usando f.id (number)
          item.magnitude = this.calculateImpact(f.id, st.name, action);
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
    const uip = this.getAdditional(factorId, stage, action).uip;
    return impact * (uip / 1000);
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
        sum + this.calculateImpact(factorId, i.etapa, i.accionTipo) * (i.uip! / 1000)
        , 0);
  }


  getAdditional(factorId: number, stage: string, action: string): AdditionalFields {
    this.additionalMap[factorId] ||= {};
    this.additionalMap[factorId][stage] ||= {};
    this.additionalMap[factorId][stage][action] ||= {
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
    return this.additionalMap[factorId][stage][action];
  }


  getUIPValue(factorId: number): number {
    const vals = Object.values(this.additionalMap[factorId] || {})
      .flatMap(v => Object.values(v).map(a => a.uip));
    return vals.length > 0 ? vals[0] : 0;
  }

computeSummaryIRTs(): void {
  const summary: FactorSummary[] = this.factors.map(f => ({
    factor: f.factor,
    componente: f.componente!,  // ← aquí incluimos componente
    irt: this.calculateImportanciaRelativaTotalFactor(f.id),
    actions: Object
      .keys(this.valuationsMap[f.id] || {})
      .flatMap(stage =>
        Object.keys(this.valuationsMap[f.id]?.[stage] || {})
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



  //Primer grafico de barras, lista los componentes
createBarChart(): void {
  const labels: string[] = [];
  const pos: number[]    = [];
  const neg: number[]    = [];

  // 1) Construir labels con "Factor – Componente"
  this.factors.forEach(f => {
    const v = this.calculateImportanciaRelativaTotalFactor(f.id);
    labels.push(`${f.factor} – ${f.componente!}`);
    if (v >= 0) {
      pos.push(v);
      neg.push(0);
    } else {
      pos.push(0);
      neg.push(v);
    }
  });

  // 2) Crear o actualizar el Chart.js
  const ctx = this.irtBarChartRef.nativeElement.getContext('2d')!;
  if (this.irtChart) {
    this.irtChart.data.labels            = labels;
    this.irtChart.data.datasets![0].data = pos;
    this.irtChart.data.datasets![1].data = neg;
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
      // plugin para fondo blanco
      plugins: [{
        id: 'whiteBackground',
        beforeDraw: chart => {
          const ctx = chart.ctx;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      }],
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              font: {
                weight: 'bold'      // ← Leyenda en negrita
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              font: {
                weight: 'bold'      // ← Eje X en negrita
              }
            }
          },
          y: {
            ticks: {
              font: {
                weight: 'bold'      // ← Eje Y en negrita
              }
            }
          }
        }
      }
    });
  }
}

//segundo grafico de barras

createBarChartActions(): void {
  // 1) Construir array de acciones y labels usando "Factor – Componente"
  const actions  = Array.from(new Set(this.stages.flatMap(s => s.actions)));
  const labels   = this.factors.map(f => `${f.factor} – ${f.componente!}`);
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

  // 2) Crear o actualizar el Chart.js
  const ctx = this.irtActionsChartRef.nativeElement.getContext('2d')!;
  if (this.actionsChart) {
    this.actionsChart.data.labels   = labels;
    this.actionsChart.data.datasets = datasets;
    this.actionsChart.update();
  } else {
    this.actionsChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      plugins: [{
        id: 'whiteBackground',
        beforeDraw: chart => {
          const ctx = chart.ctx;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      }],
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              font: {
                weight: 'bold'    // ← Leyenda en negrita
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              font: {
                weight: 'bold'    // ← Eje X en negrita
              }
            }
          },
          y: {
            ticks: {
              font: {
                weight: 'bold'    // ← Eje Y en negrita
              }
            }
          }
        }
      }
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

  get topThreePosIRTsFiltered(): FactorSummary[] {
    return this.topThreePosIRTs.filter(i => i.irt >= 0);

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

  //calcula el top tres de acciones por etapas
  private computeTopThreeActionIRTs(): void {
    const summaries: ActionIRTSummary[] = [];

    this.stages.forEach(stage =>
      stage.actions.forEach(action => {
        const irt = this.getGlobalRelativeAction(stage.name, action);
        summaries.push({ etapa: stage.name, accion: action, irt });
      })
    );

    // Top 3 positivos
    this.topThreeActionPosIRTs = summaries
      .filter(s => s.irt > 0)
      .sort((a, b) => b.irt - a.irt)
      .slice(0, 3);

    // Top 3 negativos
    this.topThreeActionNegIRTs = summaries
      .filter(s => s.irt < 0)
      .sort((a, b) => a.irt - b.irt)
      .slice(0, 3);
  }

  getImpactClass(factorId: number, stage: string, action: string): string {
    const imp = Math.abs(this.calculateImpact(factorId, stage, action)); // valor absoluto
    if (imp < 25) return 'impact-compatible';
    else if (imp < 50) return 'impact-moderado';
    else if (imp <= 75) return 'impact-severo';
    else return 'impact-critico';
  }

  // 1️⃣ Propiedad de modo de vista
  public selectedViewMode: 'complete' | 'stages' | 'systems' | 'combined' | null = null;

  // 2️⃣ Métodos para cambiar/resetear modo
  setViewMode(mode: 'complete' | 'stages' | 'systems' | 'combined'): void {
    this.selectedViewMode = mode;
  }
  resetViewMode(): void {
    this.selectedViewMode = null;
  }

  // 3️⃣ Método genérico para descargar sólo la sección indicada
  /** Método genérico para descargar sólo la sección indicada */
  downloadTable(container: HTMLElement, label: string): void {
    if (!container) return;

    // 1) Activamos el spinner antes de cualquier trabajo pesado
    this.loadingDownloads[label] = true;

    // 2) Envolvemos el html2canvas en setTimeout para que Angular pinte el spinner
    setTimeout(() => {
      html2canvas(container, { scale: 2 })
        .then(canvas =>
          new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(blob => blob ? resolve(blob) : reject('no-blob'))
          )
        )
        .then(blob => {
          const fileName = `${label}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(file);
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(a.href);
        })
        .catch(err => {
          console.error('Error downloadTable:', err);
        })
        .finally(() => {
          // 3) Desactivamos el spinner pase lo que pase
          this.loadingDownloads[label] = false;
        });
    }, 0);
  }

  // 4️⃣ Getter para sistemas únicos
  public get uniqueSystems(): string[] {
    return Array.from(new Set(this.factors.map(f => f.sistema)));
  }

  // 1️⃣ IAT total de un factor en una etapa
  calculateImportanciaAbsolutaPorEtapa(factorId: number, etapa: string): number {
    const st = this.stages.find(s => s.name === etapa);
    if (!st) return 0;
    return st.actions.reduce((sum: number, action: string) =>
      sum + this.calculateImpact(factorId, etapa, action)
      , 0);
  }

  // 2️⃣ IRT total de un factor en una etapa
  calculateImportanciaRelativaPorEtapa(factorId: number, etapa: string): number {
    const st = this.stages.find(s => s.name === etapa);
    if (!st) return 0;
    return st.actions.reduce((sum: number, action: string) => {
      const impact = this.calculateImpact(factorId, etapa, action);
      const uip = this.getAdditional(factorId, etapa, action).uip ?? 0;
      return sum + impact * (uip / 1000);
    }, 0);
  }

  // 3️⃣ Suma de IAT para todos los factores de un sistema en una etapa
  getGroupAbsolutaPorEtapa(sistema: string, etapa: string): number {
    return this.factors
      .filter(f => f.sistema === sistema)
      .reduce((sum: number, f: FactorView) =>
        sum + this.calculateImportanciaAbsolutaPorEtapa(f.id, etapa)
        , 0);
  }

  // 4️⃣ Suma de IRT para todos los factores de un sistema en una etapa
  getGroupRelativaPorEtapa(sistema: string, etapa: string): number {
    return this.factors
      .filter(f => f.sistema === sistema)
      .reduce((sum: number, f: FactorView) =>
        sum + this.calculateImportanciaRelativaPorEtapa(f.id, etapa)
        , 0);
  }



  // 1) Sólo Factores
createFactorsChart() {
  // 1) Construir labels con "Factor – Componente"
  const labels = this.factors.map(f => `${f.factor} – ${f.componente!}`);
  const data   = labels.map((_, i) =>
    this.calculateImportanciaRelativaTotalFactor(this.factors[i].id)
  );
  const ctx = this.factorsChartRef.nativeElement.getContext('2d')!;

  if (this.factorsChart) {
    this.factorsChart.data.labels            = labels;
    this.factorsChart.data.datasets![0].data = data;
    this.factorsChart.update();
  } else {
    this.factorsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'IRT', data }]
      },
      plugins: [this.whiteBgPlugin],
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              font: {
                weight: 'bold'   // ← Leyenda en negrita
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              font: {
                weight: 'bold'   // ← Eje X en negrita
              }
            }
          },
          y: {
            ticks: {
              font: {
                weight: 'bold'   // ← Eje Y en negrita
              }
            }
          }
        }
      }
    });
  }
}



  // 2) Sólo Acciones (agregado sobre todas las etapas y factores)
// 2) Sólo Acciones (agregado sobre todas las etapas y factores)
createActionsOnlyChart() {
  // 1) Datos
  const allActions = Array.from(new Set(this.stages.flatMap(s => s.actions)));
  const labels     = allActions;
  const data       = allActions.map(ac =>
    this.factors.reduce((sum, f) =>
      sum + this.stages.reduce((ss, st) =>
        ss + this.calculateImpact(f.id, st.name, ac)
            * (this.getAdditional(f.id, st.name, ac).uip! / 1000)
        , 0)
      , 0)
  );

  const ctx = this.actionsOnlyChartRef.nativeElement.getContext('2d')!;
  const yAxisMinWidth = 170;

  if (this.actionsOnlyChart) {
    // 2a) Actualizar datos
    this.actionsOnlyChart.data.labels            = labels;
    this.actionsOnlyChart.data.datasets![0].data = data;

    // 2b) Actualizar opciones en negrita
    const opts = this.actionsOnlyChart.options;
    opts.indexAxis = 'y' as 'y';
    opts.maintainAspectRatio = false;
    opts.plugins = {
      ...opts.plugins,
      title: {
        display: true,
        text: 'IRT Acumulada por Acción',
        font: { weight: 'bold', size: 14 }
      },
      legend: {
        labels: { font: { weight: 'bold' } }
      }
    };
    opts.layout = {
      ...(opts.layout || {}),
      padding: {
        ...((opts.layout as any)?.padding || {}),
        left: 8,
        right: 8
      }
    };
    opts.scales = {
      ...opts.scales,
      ['x']: {
        ...(opts.scales?.['x'] as any),
        ticks: { font: { weight: 'bold' } }
      },
      ['y']: {
        ...(opts.scales?.['y'] as any),
        ticks: { font: { weight: 'bold' }, autoSkip: false },
        afterFit: (scale: any) => {
          if (scale.width < yAxisMinWidth) {
            scale.width = yAxisMinWidth;
          }
        }
      }
    };

    // 2c) Redibujar
    this.actionsOnlyChart.update();
  } else {
    // 3) Primera creación con negritas y título
    this.actionsOnlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'IRT acumulada', data }]
      },
      plugins: [this.whiteBgPlugin],
      options: {
        responsive: true,
        indexAxis: 'y' as 'y',
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 8,
            right: 8
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'IRT Acumulada por Acción',
            font: { weight: 'bold', size: 14 }
          },
          legend: {
            labels: { font: { weight: 'bold' } }
          }
        },
        scales: {
          ['x']: { ticks: { font: { weight: 'bold' } } },
          ['y']: {
            ticks: { font: { weight: 'bold' }, autoSkip: false },
            afterFit: (scale: any) => {
              if (scale.width < yAxisMinWidth) {
                scale.width = yAxisMinWidth;
              }
            }
          }
        }
      }
    });
  }
}



  

  // 3) Acciones por Etapa
  createActionsByStageChart(): void {
    // 1) Todas las acciones como etiquetas (suponemos que todas las etapas comparten el mismo conjunto):
    const labels = this.stages[0]?.actions || [];

    // 2) Construimos un dataset por cada etapa, usando sólo su nombre (string)
    const datasets: ChartDataset<'bar', number[]>[] = this.stages.map(stage => ({
      label: stage.name,            // <-- STRING, no el objeto Stage
      data: labels.map(action =>
        this.factors.reduce((sum, f) =>
          sum
          + this.calculateImpact(f.id, stage.name, action)    // <-- stage.name
          * (this.getAdditional(f.id, stage.name, action).uip! / 1000), // <-- stage.name
          0
        )
      )
    }));

    const ctx = this.actionsByStageChartRef.nativeElement.getContext('2d')!;
    if (this.actionsByStageChart) {
      this.actionsByStageChart.data.labels = labels;
      this.actionsByStageChart.data.datasets = datasets;
      this.actionsByStageChart.update();
    } else {
      this.actionsByStageChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        plugins: [this.whiteBgPlugin],
        options: { responsive: true }
      });
    }
  }


  shouldShowFactorsChart(): boolean {
    return this.factors.length > 0;
  }

  shouldShowActionsOnlyChart(): boolean {
    return this.stages.some(s => s.actions.length > 0);
  }

  shouldShowActionsByStageChart(): boolean {
    return this.shouldShowActionsOnlyChart();
  }


  /** Descarga cualquier Chart.js como JPG */
  downloadChart(chartRef: Chart | undefined, filename: string) {
    if (!chartRef) return;
    const dataUrl = chartRef.toBase64Image('image/jpeg', 0.9);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename}.jpg`;
    a.click();
  }

   shouldShowPieChart(): boolean {
    return this.factors.some(f =>
      this.stages.some(st =>
        st.actions.some(ac => this.calculateImpact(f.id, st.name, ac) !== 0)
      )
    );
  }

  /** Crea el gráfico de torta con la distribución de clases de impacto */

createPieChart(): void {
  type ImpactClass = 'impact-compatible' | 'impact-moderado' | 'impact-severo' | 'impact-critico';

  // 1) Inicializar contadores
  const counts: Record<ImpactClass, number>    = {
    'impact-compatible': 0,
    'impact-moderado':   0,
    'impact-severo':     0,
    'impact-critico':    0
  };
  const countsPos: Record<ImpactClass, number> = { ...counts };
  const countsNeg: Record<ImpactClass, number> = { ...counts };

  // 2) Contabilizar impactos
  this.factors.forEach(f => {
    this.stages.forEach(st => {
      st.actions.forEach(action => {
        const val = this.calculateImpact(f.id, st.name, action);
        if (val === 0) return;
        const cls = this.getImpactClass(f.id, st.name, action) as ImpactClass;
        counts[cls]++;
        if (val > 0) countsPos[cls]++; else countsNeg[cls]++;
      });
    });
  });

  // 3) Filtrar claves y construir etiquetas y datos
  const impactKeys   = ['impact-compatible', 'impact-moderado', 'impact-severo', 'impact-critico'] as ImpactClass[];
  const baseLabels   = ['Compatible (<25)', 'Moderado (25-50)', 'Severo (50-75)', 'Crítico (>75)'];
  const filteredKeys = impactKeys.filter(k => counts[k] > 0);
  const labels       = filteredKeys.map(k => {
    const idx   = impactKeys.indexOf(k);
    const total = counts[k];
    const pos   = countsPos[k];
    const neg   = countsNeg[k];
    return `${baseLabels[idx]} (T:${total}, +:${pos}, -:${neg})`;
  });
  const data         = filteredKeys.map(k => counts[k]);
  const colorMap     = {
    'impact-compatible': '#FDFCF9',
    'impact-moderado':   '#78e97c',
    'impact-severo':     '#e9de49',
    'impact-critico':    '#db2f41'
  };
  const bgColors     = filteredKeys.map(k => colorMap[k]);
  const borderColors = filteredKeys.map(() => '#000');

  // 4) Crear o actualizar el Chart.js
  const ctx = this.pieChartRef.nativeElement.getContext('2d')!;
  if (this.pieChart) {
    // Actualizar datos y estilos
    this.pieChart.data.labels            = labels;
    this.pieChart.data.datasets![0].data = data;
    this.pieChart.data.datasets![0].backgroundColor = bgColors;
    this.pieChart.data.datasets![0].borderColor     = borderColors;
    this.pieChart.update();
  } else {
    // Primera creación con padding inferior
    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      plugins: [
        this.whiteBgPlugin,
        ChartDataLabels
      ],
      options: {
        responsive: true,
        layout: {
          padding: {
            bottom: 20    // ← Padding de 20px debajo del gráfico
          }
        },
        plugins: {
          legend: {
            labels: {
              font: { weight: 'bold' }  // Leyenda en negrita
            }
          },
          datalabels: {
            color: '#000',
            anchor: 'end',
            align: 'start',
            font: { weight: 'bold', size: 12 },  // Etiquetas internas en negrita
            formatter: (val: number) => val
          }
        }
      }
    });
  }
}





}
