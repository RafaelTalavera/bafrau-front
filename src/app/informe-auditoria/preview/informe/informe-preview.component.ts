import { Component, ElementRef, ViewChild, OnInit, ViewEncapsulation, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CapituloDTO } from '../../models/capitulo-dto';
import { SeccionDTO } from '../../models/seccion-dto';
import { NavComponent } from '../../../gobal/nav/nav.component';
import { FooterComponent } from '../../../gobal/footer/footer.component';
import { InformeDTO } from '../../models/informe-dto.models';
import { InformeAuditoriaService } from '../../service/informe-auditoria.service';
import { EncabezadoService } from '../../service/encabezado.service';
import { SpinnerComponent } from '../../../utils/spinner/spinner.component';

// Servicio de carátula
import { CaratulaService } from '../../service/caratula.service';
import { InformePreviewDTO, PreviewSeccionFull, PreviewTablaFull } from '../../models/informe-preview-dto.models';
import { StyleTemplateService } from '../../style-template/service/style-template.service';

interface Adjunto { urlAdjunto: string; }
interface TableCell { contenido: string; }
interface TableRow { celdas: TableCell[]; }
interface Tabla { nombre: string; filas: TableRow[]; }
interface ChapterWithSections {
  cap: CapituloDTO;
  secciones: SeccionDTO[];
  tablasPorSeccion: Tabla[][];
}

// === Helper: transforma múltiples formatos a "mes-largo-YYYY" ===
function formatearFechaCaratula(
  input: string | Date | null | undefined,
  fallbackDate?: Date
): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  let mes: number | undefined;
  let anio: number | undefined;

  if (input instanceof Date && !isNaN(input.getTime())) {
    mes = input.getMonth() + 1;
    anio = input.getFullYear();
  } else {
    const s = String(input ?? '').trim();
    if (!s) return '';

    const mmYYYY = s.match(/^(\d{1,2})[\/\-](\d{4})$/);
    const yyyyMM = s.match(/^(\d{4})[\/\-](\d{1,2})$/);
    const soloMM = s.match(/^(\d{1,2})$/);

    if (mmYYYY) {
      mes = parseInt(mmYYYY[1], 10);
      anio = parseInt(mmYYYY[2], 10);
    } else if (yyyyMM) {
      anio = parseInt(yyyyMM[1], 10);
      mes = parseInt(yyyyMM[2], 10);
    } else if (soloMM) {
      mes = parseInt(soloMM[1], 10);
    } else {
      return '';
    }
  }

  if (!mes || mes < 1 || mes > 12) return '';
  const nombreMes = meses[mes - 1];
  const year = anio ?? fallbackDate?.getFullYear();
  return year ? `${nombreMes}-${year}` : `${nombreMes}`;
}

/* === NUEVO ===
   Normaliza el nombre de plantilla: quita acentos y pasa a minúsculas.
   Así "viñeta" y "vineta" se tratan igual.
*/
function normalizeTemplateName(value: string | null | undefined): string {
  const raw = String(value ?? '').trim();
  return raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/* === NUEVO ===
   Parsea el contenido de viñetas:
   - Soporta \n, \r\n y <br>/<br/>.
   - Limpia prefijos comunes (-, *, •) y espacios.
   - Descarta líneas vacías.
*/
function parseBulletLines(text: string | null | undefined): string[] {
  const raw = String(text ?? '');
  const unified = raw.replace(/<br\s*\/?>/gi, '\n'); // unifica <br> a \n
  return unified
    .split(/\r?\n/)
    .map(s => s.trim())
    .map(s => s.replace(/^[\-\*\u2022]\s+/, '')) // quita -, *, • iniciales
    .filter(s => s.length > 0);
}

/* === NUEVO ===
   Convierte HTML simple a texto llano para títulos de índice.
*/
function plainText(input: string | null | undefined): string {
  const s = String(input ?? '');
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

@Component({
  selector: 'app-informe-preview',
  standalone: true,
  imports: [CommonModule, NavComponent, FooterComponent, SpinnerComponent],
  templateUrl: './informe-preview.component.html',
  styleUrls: ['./informe-preview.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class InformePreviewComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('previewContainer', { static: false })
  previewContainer!: ElementRef<HTMLDivElement>;
  private _styleMap = new Map<number, string>(); // id -> nombre de plantilla

  informeId!: number;
  informe!: InformeDTO;
  capitulos: CapituloDTO[] = [];
  loading = false;

  previewHtml: SafeHtml | null = null;

  private _lastPreviewDTO!: InformePreviewDTO;
  private _lastCaratulas: any[] = [];
  private _lastEncabezados: any[] = [];

  // listener cleanup
  private removeDblClickListener?: () => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2,
    private caratulaService: CaratulaService,
    private infService: InformeAuditoriaService,
    private encabezadoService: EncabezadoService,
    private sanitizer: DomSanitizer,
    private styleTemplateService: StyleTemplateService
  ) { }

  // ---------- Helpers de estabilidad de layout/fuentes ----------
  private async raf(): Promise<void> {
    await new Promise<void>(r => requestAnimationFrame(() => r()));
  }
  private async settleLayout(): Promise<void> {
    await this.raf();
    await this.raf();
  }
  private async warmFonts(): Promise<void> {
    const probe = document.createElement('span');
    probe.style.cssText = `
      position:absolute; left:-9999px; top:-9999px;
      font-family:"Paytone One","Fredoka","Baloo 2","Arial Black",Arial,sans-serif;
      font-size:60px; line-height:1`;
    probe.textContent = 'HhXx123 ÁÉÍ';
    document.body.appendChild(probe);
    try {
      const fonts: any = (document as any).fonts;
      if (fonts?.ready) await fonts.ready;
    } finally {
      document.body.removeChild(probe);
    }
  }

  private async calibrateUnits(): Promise<{ pxPerMm: number; pageWidthPx: number; pageHeightPx: number }> {
    await this.waitForFonts();
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.width = '210mm';
    probe.style.height = '297mm';
    probe.style.left = '-10000px';
    probe.style.top = '-10000px';
    document.body.appendChild(probe);

    const rect = probe.getBoundingClientRect();
    document.body.removeChild(probe);

    const pxPerMm = rect.width / 210;
    return { pxPerMm, pageWidthPx: rect.width, pageHeightPx: rect.height };
  }

  private async waitForFonts(): Promise<void> {
    try {
      const fonts = (document as any).fonts;
      if (fonts?.ready) {
        await fonts.ready;
      }
    } catch { /* no-op */ }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.informeId = Number(params.get('id'));

      const obsInforme = this.infService.getById(this.informeId);
      const obsPreview = this.infService.getPreview(this.informeId);
      const obsCaratula = this.caratulaService.getByInforme(this.informeId);
      const obsEncabezados = this.encabezadoService.getByInformeId(this.informeId);
      const obsStyles = this.styleTemplateService.findAll(); // ← mapea id->nombre

      this.loading = true;

      forkJoin([obsInforme, obsPreview, obsCaratula, obsEncabezados, obsStyles]).subscribe({
        next: async ([inf, preview, caratulas, encabezados, styles]) => {
          this.informe = inf;

          (styles || []).forEach((s: any) => {
            const id = Number(s.id);
            const nombre = String(s.nombre ?? '');
            if (!Number.isNaN(id) && nombre) {
              this._styleMap.set(id, nombre);
            }
          });

          this.capitulos = (preview.capitulos || [])
            .sort((a, b) => a.orden - b.orden)
            .map(c => ({
              id: c.id,
              titulo: c.titulo,
              orden: c.orden,
              informeId: c.informeId
            } as CapituloDTO));

          this._lastPreviewDTO = preview;
          this._lastCaratulas = caratulas as any[];
          this._lastEncabezados = encabezados as any[];

          await this.previewInformeDesdeDTO(this._lastPreviewDTO, this._lastCaratulas, this._lastEncabezados);
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    });
  }

  ngAfterViewInit(): void {
    // delegación de eventos: un sólo listener para todo el HTML generado
    this.removeDblClickListener = this.renderer.listen(
      this.previewContainer?.nativeElement,
      'dblclick',
      (ev: MouseEvent) => this.onPreviewDblClick(ev)
    );
  }

  ngOnDestroy(): void {
    if (this.removeDblClickListener) this.removeDblClickListener();
  }

  private onPreviewDblClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement;
    if (!t) return;
    const el = t.closest<HTMLElement>('[data-entity]');
    if (!el) return;

    const entity = el.getAttribute('data-entity');
    if (!entity) return;

    // IDs y datos
    const id = el.getAttribute('data-id');
    const secId = el.getAttribute('data-seccion-id');
    const capituloId = el.getAttribute('data-capitulo-id');
    const tablaName = el.getAttribute('data-tabla-nombre');

    switch (entity) {
      case 'caratula': {
        this.router.navigate(
          ['/caratula', this.informeId],
          { queryParams: id ? { editId: id } : {} }
        );
        break;
      }
      case 'encabezado': {
        this.router.navigate(
          ['/encabezado', this.informeId],
          { queryParams: id ? { editId: id } : {} }
        );
        break;
      }
      case 'capitulo': {
        this.router.navigate(
          ['/capitulo', this.informeId],
          { queryParams: id ? { editId: id } : {} }
        );
        break;
      }
      case 'seccion': {
        const capId = capituloId ? Number(capituloId) : undefined;
        if (!capId) return;
        const qp: any = {};
        if (id) qp.editId = id;
        this.router.navigate(['/capitulo', capId, 'seccion'], { queryParams: qp });
        break;
      }
      case 'tabla': {
        const capId = capituloId ? Number(capituloId) : undefined;
        if (!capId || !secId) return;
        const qp: any = { editId: secId, openTable: true };
        if (tablaName) qp.tablaName = tablaName;
        this.router.navigate(['/capitulo', capId, 'seccion'], { queryParams: qp });
        break;
      }
      default:
        break;
    }
  }

  async previewInforme(): Promise<void> {
    if (!this._lastPreviewDTO) {
      console.warn('[InformePreview] No hay datos de preview cargados aún.');
      return;
    }
    this.loading = true;
    try {
      await this.previewInformeDesdeDTO(this._lastPreviewDTO, this._lastCaratulas, this._lastEncabezados);
    } finally {
      this.loading = false;
    }
  }

  // ========= Construcción de previsualización (marcando data-entity) =========
  private async previewInformeDesdeDTO(
    preview: InformePreviewDTO,
    listaCar: any[],
    encabezados: any[]
  ): Promise<void> {
    this.previewHtml = null;

    const tableStartPages: number[] = [];
    const tableNames: string[] = [];
    const imageStartPages: number[] = [];
    const imageCaptions: string[] = [];

    // === NUEVO: mapa para subtítulos con su página, agrupados por capítulo
    const subtitulosPorCapitulo = new Map<number, { titulo: string; page: number }[]>();

    // ——— 1) Carátula ———
    const car: any = listaCar?.[0];
    const url1 = car?.adjuntos?.[0]?.urlAdjunto || '';
    const url2 = car?.adjuntos?.[1]?.urlAdjunto || '';
    const carId = car?.id ?? '';

    const primeraImagen = url1
      ? `<div class="primer-imagen">
           <img src="${url1}" alt="Adjunto 1"/>
         </div>`
      : '';

    const tituloHtml = `<h1 class="titulo-realiza-extra">${car?.titulo ?? ''}</h1>`;

    const segundaImagen = url2
      ? `<div class="segunda-imagen">
           <img src="${url2}" alt="Adjunto 2"/>
         </div>`
      : '';

    const fallbackDate = this?.informe?.fecha ? new Date(this.informe.fecha) : undefined;
    const fechaCaratula: string = formatearFechaCaratula(car?.fecha, fallbackDate);

    const detalles = `
      <div class="nyala-text">
        <p><strong>Elaborador:</strong> ${car?.elaborador ?? ''}</p>
        <p><strong>Fecha:</strong> ${fechaCaratula || 's/f'}</p>
      </div>
    `;

    const blockCar = `
      <div class="section-block cover-page"
           data-entity="caratula"
           data-id="${carId}"
           data-informe-id="${this.informeId}">
        ${primeraImagen}${tituloHtml}${segundaImagen}${detalles}
      </div>`;

    const carInner = `
      <img class="corner top-right" src="assets/dist/img/esquina-2.png" alt="Esq. sup. der."/>
      ${blockCar}
      <img class="corner bottom-left" src="assets/dist/img/esquina-1.png" alt="Esq. inf. izq."/>
    `;

    // ——— 2) Cabecera ———
    const todosAdj = (encabezados ?? []).flatMap((e: any) => e.adjuntos ?? []);
    const logoIzq = todosAdj[0]?.urlAdjunto || '';
    const logoDer = todosAdj[1]?.urlAdjunto || '';
    const textoEnc = encabezados?.[0]?.contenido || '';
    const encId = encabezados?.[0]?.id ?? '';

const headerHtml = `
  <div class="report-header"
       data-entity="encabezado"
       data-id="${encId}"
       data-informe-id="${this.informeId}">
    <img src="${logoIzq}" alt="Logo IZQ" class="report-logo" crossorigin="anonymous"/>
    <div class="header-center">
      <div class="header-title">${textoEnc}</div>
      <div class="header-date">${fechaCaratula}</div>
    </div>
    <img src="${logoDer}" alt="Logo DER" class="report-logo" crossorigin="anonymous"/>
  </div>
`;


    // ——— 3) Capítulos base ———
    const capitulosOrdenados = [...this.capitulos].sort((a, b) => a.orden - b.orden);

    // ——— 4) Construir secciones/tablas ———
    const seccionesPorCapitulo = new Map<number, SeccionDTO[]>();
    const tablasPorSeccionMap = new Map<number, Tabla[]>();

    (preview.secciones || []).forEach((s: PreviewSeccionFull) => {
      const styleNameById = this._styleMap.get(Number(s.styleTemplateId)) ?? '';
      const styleNameRaw = (s as any).styleTemplateNombre ?? styleNameById;

      const sDto: SeccionDTO = {
        id: s.id,
        capituloId: s.capituloId,
        orden: s.orden,
        contenido: s.contenido,
        styleTemplateNombre: styleNameRaw,
        styleTemplateId: s.styleTemplateId ?? 0,
        adjuntos: (s.adjuntos || []).map(a => ({
          id: a.id, descripcion: a.descripcion, urlAdjunto: a.urlAdjunto
        }))
      } as any;

      const arr = seccionesPorCapitulo.get(s.capituloId) || [];
      arr.push(sDto);
      seccionesPorCapitulo.set(s.capituloId, arr);
    });

    seccionesPorCapitulo.forEach((arr, capId) => {
      arr.sort((a, b) => a.orden - b.orden);
      seccionesPorCapitulo.set(capId, arr);
    });

    (preview.tablas || []).forEach((t: PreviewTablaFull) => {
      const tLocal: Tabla = {
        nombre: t.nombre,
        filas: (t.filas || [])
          .sort((f1, f2) => f1.numeroFila - f2.numeroFila)
          .map(f => ({
            celdas: (f.celdas || [])
              .sort((c1, c2) => c1.numeroColumna - c2.numeroColumna)
              .map(c => ({ contenido: c.contenido }))
          }))
      };
      const arr = tablasPorSeccionMap.get(t.seccionId) || [];
      arr.push(tLocal);
      tablasPorSeccionMap.set(t.seccionId, arr);
    });

    // ——— 5) Pre-cargar imágenes ———
    const imageUrls: string[] = [];
    if (logoIzq) imageUrls.push(logoIzq);
    if (logoDer) imageUrls.push(logoDer);
    if (url1) imageUrls.push(url1);
    if (url2) imageUrls.push(url2);
    (preview.secciones || []).forEach(s =>
      (s.adjuntos || []).forEach(a => a.urlAdjunto && imageUrls.push(a.urlAdjunto))
    );

    await this.warmFonts();
    await this.preloadImages(imageUrls);
    await this.settleLayout();

    // ——— 6) Medidas ———
    const P = { top: 20, right: 20, bottom: 30, left: 20 }; // mm
    const { pxPerMm, pageHeightPx: pageHeightPxFull } = await this.calibrateUnits();
    const pageHeightPx = pageHeightPxFull - pxPerMm * (P.top + P.bottom);

    const host = this.previewContainer?.nativeElement!;
    if (!host) throw new Error('previewContainer no disponible');

    const ghostPage = document.createElement('div');
    ghostPage.className = 'page';
    ghostPage.style.position = 'absolute';
    ghostPage.style.visibility = 'hidden';
    ghostPage.style.left = '-10000px';
    ghostPage.style.top = '-10000px';
    ghostPage.style.height = 'auto';
    (ghostPage.style as any).contain = 'layout style size';
    host.appendChild(ghostPage);

    const measurer = document.createElement('div');
    measurer.style.width = '100%';
    measurer.style.boxSizing = 'border-box';
    ghostPage.appendChild(measurer);
    await this.settleLayout();

    // Medición estable del header
    measurer.innerHTML = headerHtml;
    await this.settleLayout();
    const headerHeight = (measurer.firstElementChild as HTMLElement).offsetHeight;

    // ——— 7) Paginación del contenido principal ———
    const pages: string[] = [carInner];
    let currentHtml = headerHtml;
    let usedHeight = headerHeight;
    let contadorFiguras = 0;
    let contadorTablas = 0;
    const chapterStartPages: number[] = [];

    for (const cap of capitulosOrdenados) {
      // cada capítulo inicia en hoja nueva (si hay contenido en la actual)
      if (usedHeight > headerHeight) {
        pages.push(currentHtml);
        currentHtml = headerHtml;
        usedHeight = headerHeight;
      }

      // registro de la hoja (excluyendo carátula) donde comienza el capítulo
      chapterStartPages.push(pages.length);

      const titleBlock = `
        <div class="section-block chapter-title"
             data-entity="capitulo"
             data-id="${cap.id ?? ''}"
             data-informe-id="${this.informeId}">
          <h3>${cap.titulo ?? ''}</h3>
        </div>`;
      measurer.innerHTML = titleBlock;
      await this.settleLayout();
      const titleHeight = (measurer.firstElementChild as HTMLElement).offsetHeight;
      currentHtml += titleBlock;
      usedHeight += titleHeight;

      const secciones = seccionesPorCapitulo.get(cap.id!) || [];
      for (const sec of secciones) {
        const templateName = normalizeTemplateName((sec as any)['styleTemplateNombre']);
        const items = parseBulletLines(sec.contenido);
        let contentHtml: string;

        switch (templateName) {
          case 'titulo':
            contentHtml = `<div class="sec-titulo">${sec.contenido}</div>`; break;
          case 'subtitulo':
            contentHtml = `<div class="sec-subtitulo">${sec.contenido}</div>`; break;
          case 'matriz':
            contentHtml = `<div class="sec-matriz">${sec.contenido}</div>`; break;
          case 'vineta':
            contentHtml = items.length < 2
              ? `<p class="texto-calibri-10">${sec.contenido ?? ''}</p>`
              : `<ul class="sec-vineta vineta-calibri-10">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
            break;
          case 'texto':
            contentHtml = `<div class="sec-texto texto-calibri-10">${sec.contenido}</div>`; break;
          default:
            contentHtml = `<p>${sec.contenido}</p>`;
        }

        // Figuras (adjuntos como imágenes) — registrar después de colocar el bloque
        const imgs = (sec.adjuntos || []) as Adjunto[];
        const imgsCount = imgs.length;

        let figurasHtml = '';
        const pendingFigureCaptions: string[] = [];

        imgs.forEach(a => {
          contadorFiguras++;
          const captionText = `Figura ${contadorFiguras}: ${sec.contenido}`;
          pendingFigureCaptions.push(captionText);

          // Envolvemos la imagen en .figure-media para poder fijar altura uniforme en CSS
          figurasHtml += `
  <figure class="figure-item"
          data-entity="seccion"
          data-id="${sec.id ?? ''}"
          data-capitulo-id="${cap.id ?? ''}">
    <div class="figure-media">
      <img src="${a.urlAdjunto}" alt="Figura ${contadorFiguras}"/>
    </div>
    <figcaption>
      <strong>Figura ${contadorFiguras}:</strong> ${sec.contenido}
    </figcaption>
  </figure>`;
        });

        const colClass =
          imgsCount >= 6 ? 'cols-6' :
          imgsCount === 5 ? 'cols-5' :
          imgsCount === 4 ? 'cols-4' :
          imgsCount === 3 ? 'cols-3' :
          imgsCount === 2 ? 'cols-2' : 'cols-1';

        const imagesWrapperHtml = `
<div class="images-wrapper ${colClass}">
  ${figurasHtml}
</div>`;

        const tablas = tablasPorSeccionMap.get(sec.id!) || [];
        const hasTables = tablas.length > 0;

        const contentBlock = `
        <div class="section-block"
             data-entity="seccion"
             data-id="${sec.id ?? ''}"
             data-capitulo-id="${cap.id ?? ''}">
          ${(!hasTables && imgsCount === 0) ? contentHtml : ''}
          ${imagesWrapperHtml}
        </div>`;

        measurer.innerHTML = contentBlock;
        await this.settleLayout();
        const contentBlockEl = measurer.firstElementChild as HTMLElement;
        const contentBlockHeight = contentBlockEl.offsetHeight;

        if (contentBlockHeight > pageHeightPx) {
          console.warn('[WARN] Bloque > 1 página. Se fuerza salto para evitar overflow visual.');
        }

        // ¿Cabe en la página actual?
        if (usedHeight + contentBlockHeight > pageHeightPx && currentHtml.trim() !== headerHtml.trim()) {
          // cerrar página actual y comenzar una nueva con el bloque
          pages.push(currentHtml);
          currentHtml = headerHtml + contentBlock;
          usedHeight = headerHeight + contentBlockHeight;
        } else {
          // colocar en la página actual
          currentHtml += contentBlock;
          usedHeight += contentBlockHeight;
        }

        // === NUEVO: registrar página del SUBTÍTULO (si corresponde), en orden
        // La “hoja” actual (sin contar carátula) es pages.length
        if (templateName === 'subtitulo') {
          const list = subtitulosPorCapitulo.get(cap.id!) || [];
          list.push({
            titulo: plainText(sec.contenido),
            page: pages.length
          });
          subtitulosPorCapitulo.set(cap.id!, list);
        }

        // Registrar la hoja efectiva para todas las figuras del bloque
        if (imgsCount > 0) {
          const pageNumForFigures = pages.length; // hoja actual (sin carátula)
          for (const capTxt of pendingFigureCaptions) {
            imageStartPages.push(pageNumForFigures);
            imageCaptions.push(capTxt);
          }
        }

        // Tablas (misma lógica existente)
        for (const tabla of tablas) {
          contadorTablas++;
          tableStartPages.push(pages.length);
          tableNames.push(tabla.nombre);

          const safeTablaName = (tabla.nombre || '').replace(/"/g, '&quot;');

          const captionHtml = `
          <figcaption>
            <strong>Tabla ${contadorTablas}:</strong> ${tabla.nombre}
          </figcaption>`;
          const tablaHtml = `
          <table>
            <tbody>
              ${tabla.filas.map(row =>
                `<tr>${row.celdas.map(c => `<td>${c.contenido}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>`;
          const tablaBlock = `
  <figure class="table-item tabla-calibri-10"
          data-entity="tabla"
          data-seccion-id="${sec.id ?? ''}"
          data-capitulo-id="${cap.id ?? ''}"
          data-tabla-nombre="${safeTablaName}">
    ${captionHtml}
    ${tablaHtml}
  </figure>`;

          measurer.innerHTML = tablaBlock;
          await this.settleLayout();
          const tablaHeight = (measurer.firstElementChild as HTMLElement).offsetHeight;

          if (tablaHeight > pageHeightPx) {
            console.warn('[WARN] Tabla > 1 página. Considera partir por filas o reducir estilos.');
          }

          if (usedHeight + tablaHeight > pageHeightPx && currentHtml.trim() !== headerHtml.trim()) {
            pages.push(currentHtml);
            currentHtml = headerHtml + tablaBlock;
            usedHeight = headerHeight + tablaHeight;
          } else {
            currentHtml += tablaBlock;
            usedHeight += tablaHeight;
          }
        }
      }
    }

    if (usedHeight > headerHeight) {
      pages.push(currentHtml);
    }

    // ——— 8) Índices con paginación y desplazamiento correcto ———
    const buildIndexListItem = (title: string, pageNumber: number, withHojaLabel: boolean): string => {
      const safeTitle = String(title ?? '');
      const numText = withHojaLabel ? `Hoja ${pageNumber}` : `${pageNumber}`;
      return `
        <li class="index-item">
          <span class="index-item__title">${safeTitle}</span>
          <span class="index-item__num">${numText}</span>
        </li>`;
    };

    // *** CAMBIO: paginateIndex con parámetro opcional containerExtraClass ***
    const paginateIndex = (
      titulo: string,
      itemsHtml: string[],
      headerHtmlForIndex: string,
      containerExtraClass?: string
    ): string[] => {
      const pagesForThisIndex: string[] = [];
      let bucket: string[] = [];

      const buildBlock = (lis: string[]) =>
        `<div class="section-block index-page ${containerExtraClass ?? ''}">
          <h2 class="index-page__title">${titulo}</h2>
          <ul class="index-page__list">
            ${lis.join('')}
          </ul>
        </div>`;

      const fitsInPage = (lis: string[]): boolean => {
        const block = buildBlock(lis);
        measurer.innerHTML = block;
        const blockHeight = (measurer.firstElementChild as HTMLElement).offsetHeight;
        return (headerHeight + blockHeight) <= pageHeightPx;
      };

      for (const li of itemsHtml) {
        bucket.push(li);
        if (!fitsInPage(bucket)) {
          const last = bucket.pop()!;
          if (bucket.length === 0) {
            const forced = buildBlock([last]);
            pagesForThisIndex.push(headerHtmlForIndex + forced);
            bucket = [];
          } else {
            const pageBlock = buildBlock(bucket);
            pagesForThisIndex.push(headerHtmlForIndex + pageBlock);
            bucket = [last];
          }
        }
      }
      if (bucket.length > 0) {
        const pageBlock = buildBlock(bucket);
        pagesForThisIndex.push(headerHtmlForIndex + pageBlock);
      }
      return pagesForThisIndex;
    };

    // === ÍNDICE DE CAPÍTULOS + SUBTÍTULOS (PRE-PASADA SIN OFFSET) ===
    const chapterAndSubsItems_pre: string[] = [];
    for (let i = 0; i < capitulosOrdenados.length; i++) {
      const cap = capitulosOrdenados[i];
      const capStart = (chapterStartPages[i] ?? 1);
      // Capítulo
      chapterAndSubsItems_pre.push(
        buildIndexListItem(cap.titulo ?? '', capStart, true)
      );
      // Subtítulos (si hay) en orden de sucesión
      const subs = subtitulosPorCapitulo.get(cap.id!) || [];
      for (const sub of subs) {
        // Prefijo visual sin tocar CSS
        const prefixed = `— ${sub.titulo}`;
        chapterAndSubsItems_pre.push(
          buildIndexListItem(prefixed, (sub.page ?? 1), true)
        );
      }
    }

    // Índices de tablas/figuras (pre)
    const tableIndexItems_pre = tableNames.map((label, i) =>
      buildIndexListItem(label, (tableStartPages[i] ?? 1), true)
    );

    const figureIndexItems_pre = imageCaptions.map((caption, i) =>
      buildIndexListItem(caption, (imageStartPages[i] ?? 1), true)
    );

    const headerHtmlForIndex = headerHtml;

    // PASADA 1: cuántas hojas ocupa cada índice sin offset
    // *** CAMBIO: se pasa clase para cada índice ***
    const capIdxPages_pass1 = paginateIndex('Índice de capítulos', chapterAndSubsItems_pre, headerHtmlForIndex, 'index-chapters');
    const tabIdxPages_pass1 = paginateIndex('Índice de tablas', tableIndexItems_pre, headerHtmlForIndex, 'index-tables');
    const figIdxPages_pass1 = paginateIndex('Índice de figuras', figureIndexItems_pre, headerHtmlForIndex, 'index-figures');

    const totalIndexPages_pass1 =
      capIdxPages_pass1.length + tabIdxPages_pass1.length + figIdxPages_pass1.length;

    // Offset real: hojas de índices (carátula no cuenta)
    const offset = totalIndexPages_pass1;

    // === Reconstrucción con OFFSET aplicado ===
    const chapterAndSubsItems_final: string[] = [];
    for (let i = 0; i < capitulosOrdenados.length; i++) {
      const cap = capitulosOrdenados[i];
      const capStartFinal = (chapterStartPages[i] ?? 1) + offset;
      chapterAndSubsItems_final.push(
        buildIndexListItem(cap.titulo ?? '', capStartFinal, true)
      );
      const subs = subtitulosPorCapitulo.get(cap.id!) || [];
      for (const sub of subs) {
        const prefixed = `— ${sub.titulo}`;
        const pageFinal = (sub.page ?? 1) + offset;
        chapterAndSubsItems_final.push(
          buildIndexListItem(prefixed, pageFinal, true)
        );
      }
    }

    const tableIndexItems_final = tableNames.map((label, i) =>
      buildIndexListItem(label, (tableStartPages[i] ?? 1) + offset, true)
    );
    const figureIndexItems_final = imageCaptions.map((caption, i) =>
      buildIndexListItem(caption, (imageStartPages[i] ?? 1) + offset, true)
    );

    // PASADA 2: índices definitivos
    // *** CAMBIO: se pasa clase para cada índice ***
    const capIdxPages = paginateIndex('Índice de capítulos', chapterAndSubsItems_final, headerHtmlForIndex, 'index-chapters');
    const tabIdxPages = paginateIndex('Índice de tablas', tableIndexItems_final, headerHtmlForIndex, 'index-tables');
    const figIdxPages = paginateIndex('Índice de figuras', figureIndexItems_final, headerHtmlForIndex, 'index-figures');

    // ——— 9) Ensamblar páginas finales ———
    const contentPagesOnly = pages.slice(1); // quitamos carátula del contenido original
    const pagesCopy = [pages[0], ...capIdxPages, ...tabIdxPages, ...figIdxPages, ...contentPagesOnly];

    const totalContentPages = pagesCopy.length - 1; // sin carátula
    const pagesHtml = pagesCopy
      .map((pg, idx) => {
        if (idx === 0) {
          return `<div class="page">${pg}</div>`;
        }
        const pageNumber = idx; // carátula no cuenta
        return `
        <div class="page">
          ${pg}
          <div class="page-footer">Hoja ${pageNumber} de ${totalContentPages}</div>
        </div>`;
      })
      .join('');

    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<div class="preview-root">${pagesHtml}</div>`
    );

    // Limpieza del ghost
    ghostPage.remove();

    setTimeout(() => {
      const cont = this.previewContainer?.nativeElement;
      if (!cont) return;
      const pagesEls = cont.querySelectorAll('.page');
      console.log('DEBUG/pages-count:', pagesEls.length, 'scrollHeight:', cont.scrollHeight);
      pagesEls.forEach((p, i) => {
        const el = p as HTMLElement;
        el.setAttribute('data-page', String(i + 1));
        const overflow = el.scrollHeight - el.clientHeight;
        if (overflow > 2) {
          console.warn(`WARN: page ${i + 1} overflow by ${overflow}px`);
        }
      });
    }, 0);
  }

async downloadPdf(): Promise<void> {
  if (!this.previewContainer) return;
  const root = this.previewContainer.nativeElement.querySelector('.preview-root') as HTMLElement | null;
  if (!root) return;

  root.classList.add('pdf-mode'); // layout plano para captura

  try {
    // Aseguramos fuentes y layout estable
    await this.waitForFonts?.();
    await this.settleLayout?.();

    // Medidas exactas A4 en píxeles
    const { pxPerMm } = await this.calibrateUnits();
    const pageWidthPx  = Math.round(pxPerMm * 210);
    const pageHeightPx = Math.round(pxPerMm * 297);

    // Instanciamos jsPDF vía import ESM (confiable en Angular)
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    // Tomamos todas las hojas .page (lo que ves = lo que se exporta)
    const pages = Array.from(root.querySelectorAll<HTMLElement>('.page'));
    if (pages.length === 0) {
      console.warn('[PDF] No se encontraron .page para exportar.');
      return;
    }

    const scale = Math.max(2, Math.floor(window.devicePixelRatio || 2));
    console.log('[PDF] pages:', pages.length, 'scale:', scale, 'pagePx:', pageWidthPx, 'x', pageHeightPx);

    for (let i = 0; i < pages.length; i++) {
      const el = pages[i];

      // Capturamos cada hoja al tamaño exacto de A4
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: pageWidthPx,
        height: pageHeightPx,
        windowWidth: pageWidthPx,
        windowHeight: pageHeightPx,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const safeName = String(this.informe?.titulo || 'informe').replace(/[\\\/:*?"<>|]+/g, '_');
    pdf.save(`${safeName}.pdf`);
  } catch (err) {
    console.error('[PDF] export error:', err);
  } finally {
    root.classList.remove('pdf-mode');
  }
}




  private preloadImages(urls: string[]): Promise<void> {
    const fails: string[] = [];
    const unique = Array.from(new Set(urls.filter(Boolean)));
    console.log('DEBUG/preload start:', unique.length, 'urls');

    return Promise.all(
      unique.map(url =>
        new Promise<void>(resolve => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const src = url;
          img.onload = () => resolve();
          img.onerror = () => { fails.push(src); resolve(); };
          img.src = src;
        })
      )
    ).then(() => {
      if (fails.length) {
        console.warn('WARN/images failed:', fails.length, fails);
      } else {
        console.log('DEBUG/preload all ok');
      }
    });
  }
}
