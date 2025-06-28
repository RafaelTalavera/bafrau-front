// src/app/capitulo/capitulo.component.ts
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // <-- importar Router
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { CapituloDTO } from '../models/capitulo-dto';

import { InformeDTO } from '../models/informe-dto.models';
import { InformeAuditoriaService } from '../service/informe-auditoria.service';
import { CapituloService } from '../service/capitulo.service';
import { finalize, forkJoin } from 'rxjs';

import { SeccionService } from '../service/seccion.service';
import { TablaService } from '../service/tabla.service';
import { AdjuntosService } from '../../utils/adjuntos.service';

import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import panzoom from '@panzoom/panzoom';
import html2pdf from 'html2pdf.js';
import { SeccionDTO } from '../models/seccion-dto';
import { TablaDTO } from '../models/tabla-dto.model';
import { EncabezadoService } from '../service/encabezado.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';

interface SeccionConTablas extends SeccionDTO {
  tablas: TablaDTO[];
  adjuntos?: { id: number; urlAdjunto: string }[];
}

@Component({
  selector: 'app-capitulo',
  standalone: true,
  imports: [
    NavComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DragDropModule,
    SpinnerComponent  
  ],
  templateUrl: './capitulo.component.html',
  styleUrls: ['./capitulo.component.css']
})
export class CapituloComponent implements OnInit {
  informeId!: number;
  informe!: InformeDTO;
  capituloForm: FormGroup;
  capitulos: CapituloDTO[] = [];
  editarId: number | null = null;
  capituloFilter = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private capService: CapituloService,
    private infService: InformeAuditoriaService,
    private seccionService: SeccionService,
    private tablaService: TablaService,
    private adjuntosService: AdjuntosService,
    private encabezadoService: EncabezadoService,
    private cdr: ChangeDetectorRef
  ) {
    this.capituloForm = this.fb.group({
      titulo: ['', Validators.required],
      orden: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.informeId = Number(this.route.snapshot.paramMap.get('informeId'));
    if (!this.informeId) {
      return;
    }
    // 1) Cargar datos del informe para mostrar su título
    this.infService.getById(this.informeId).subscribe({
      next: (inf) => {
        this.informe = inf;
        this.cargarCapitulos();
      },
      error: (err) => {
        console.error('Error al cargar informe:', err);
        Swal.fire('Error', 'No se pudo cargar el informe', 'error');
      }
    });
  }

cargarCapitulos(): void {
  this.loading = true;
  this.capService.getAll().subscribe({
    next: data => {
      this.capitulos = (data || [])
        .filter(c => c.informeId === this.informeId)
        .sort((a, b) => a.orden - b.orden); // ordenar
      this.loading = false;
      if (this.editarId === null) {
        this.capituloForm.get('orden')!.setValue(this.getNextOrden());
      }
    },
    error: err => {
      this.loading = false;
      Swal.fire('Error', 'No se pudieron cargar los capítulos', 'error');
    }
  });
}

drop(event: CdkDragDrop<CapituloDTO[]>): void {
  // 0) Arranca spinner
  this.loading = true;
  this.cdr.detectChanges();  

  // 1) reordena en memoria
  moveItemInArray(this.capitulos, event.previousIndex, event.currentIndex);
  this.capitulos.forEach((c, i) => c.orden = i + 1);

  const updates = this.capitulos.map(c => ({ id: c.id!, orden: c.orden }));

  // 2) dispara la petición y oculta spinner en next/error
  this.capService.updateOrdenBulk(updates)
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: () => Swal.fire('¡Listo!','Orden de capítulos actualizado','success'),
      error: () => {
        Swal.fire('Error','No se pudo actualizar el orden','error');
        this.cargarCapitulos();
      }
    });
}



  onSubmit(): void {
    if (this.capituloForm.invalid) return;

    const ordenIngresado = this.capituloForm.value.orden;
    const dup = this.capitulos.some(c =>
      c.orden === ordenIngresado &&
      (this.editarId == null ? true : c.id !== this.editarId)
    );
    if (dup) {
      Swal.fire(
        'Orden repetido',
        'Ya existe un capítulo con ese orden. Debes asignar otro.',
        'error'
      );
      return;
    }

    const dto: CapituloDTO = {
      titulo: this.capituloForm.value.titulo,
      orden: ordenIngresado,
      informeId: this.informeId
    };

    // Mostrar loader
    Swal.fire({
      title: 'Cargando capítulo...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const accion$ = this.editarId == null
      ? this.capService.createCapitulo(dto)
      : this.capService.updateCapitulo(this.editarId, dto);

    accion$.pipe(
      // cerrar loading siempre, incluso en error
      finalize(() => Swal.close())
    ).subscribe({
      next: (res) => {
        if (this.editarId == null) {
          this.capitulos.push(res);
        } else {
          const idx = this.capitulos.findIndex(c => c.id === this.editarId);
          if (idx >= 0) this.capitulos[idx] = res;
          this.editarId = null;
        }
        this.capituloForm.reset({ titulo: '', orden: 1 });
        Swal.fire('Éxito', 'Capítulo cargado correctamente', 'success');
      },
      error: (err) => {
        console.error('Error al guardar capítulo:', err);
        Swal.fire('Error', 'No se pudo guardar el capítulo', 'error');
      }
    });
  }


  editarCapitulo(c: CapituloDTO): void {
    this.editarId = c.id ?? null;
    this.capituloForm.setValue({
      titulo: c.titulo,
      orden: c.orden
    });
  }

  eliminarCapitulo(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el capítulo definitivamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.capService.deleteCapitulo(id).subscribe({
          next: () => {
            this.capitulos = this.capitulos.filter((c) => c.id !== id);
            Swal.fire('Éxito', 'Capítulo eliminado correctamente', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar capítulo:', err);
            Swal.fire('Error', 'No se pudo eliminar el capítulo', 'error');
          }
        });
      }
    });
  }

cancelarEdicion(): void {
  this.editarId = null;
  // Resetea y vuelve a calcular el siguiente orden
  this.capituloForm.reset({
    titulo: '',
    orden: this.getNextOrden()
  });
}


  // Método para navegar a SeccionComponent pasando el ID del capítulo
  irACrearContenido(capituloId: number): void {
    this.router.navigate(['/capitulo', capituloId, 'seccion']);
  }

  get filteredCapitulo(): CapituloDTO[] {
    if (!this.capituloFilter) {
      return this.capitulos;
    }
    const filtro = this.capituloFilter.trim().toLowerCase();
    return this.capitulos.filter(inf =>
      inf.titulo?.toLowerCase().includes(filtro)
    );
  }

  private getNextOrden(): number {
    if (!this.capitulos.length) return 1;
    const max = Math.max(...this.capitulos.map(c => c.orden));
    return max + 1;
  }



  async previewInforme(): Promise<void> {
    // 0) Cerrar modal existente y limpiar resto
    if (Swal.isVisible()) {
      Swal.close();
    }
    document
      .querySelectorAll('#preview-zoom, style.swal2-previsualizacion-a4, .swal2-container')
      .forEach(el => el.remove());

    this.loading = true;

    // 1) Traer encabezados
    const encabezados = await firstValueFrom(
      this.encabezadoService.getByInformeId(this.informe.id)
    );
    const todosAdj = encabezados.flatMap(e => e.adjuntos);
    const logoIzq = todosAdj[0]?.urlAdjunto || '';
    const logoDer = todosAdj[1]?.urlAdjunto || '';
    const textoEncabezado = encabezados[0]?.contenido || '';

    // 2) Traer capítulos, secciones y tablas
    const capítulosConSecciones = await Promise.all(
      this.capitulos.map(async cap => {
        const seccionesDTO = await firstValueFrom(
          this.seccionService.getAll().pipe(
            map(list =>
              list
                .filter(s => s.capituloId === cap.id)
                .sort((a, b) => a.orden - b.orden)
            )
          )
        );
        const tablasPorSeccion = await Promise.all(
          seccionesDTO.map(s =>
            firstValueFrom(this.tablaService.getTablasPorSeccion(s.id!))
          )
        );
        return { cap, secciones: seccionesDTO, tablasPorSeccion };
      })
    );

    // 3) Calcular tamaño de página A4 en píxeles <<< CAMBIO
    const pxPorMm = (mm: number) => (mm / 25.4) * 96;
    const pageHeightPx = pxPorMm(297 - 20); // altura útil 297mm menos márgenes
    const measurer = document.createElement('div');
    Object.assign(measurer.style, {
      position: 'absolute',
      visibility: 'hidden',
      width: `${pxPorMm(210 - 20)}px`
    });
    document.body.appendChild(measurer);

    // 4) Definir HTML de encabezado y medir su altura <<< CAMBIO
    const headerHtml = `
      <div class="report-header">
        <img src="${logoIzq}" alt="Logo IZQ">
        <div class="header-title">${textoEncabezado}</div>
        <img src="${logoDer}" alt="Logo DER">
      </div>
    `;
    measurer.innerHTML = headerHtml;
    const headerHeight = (measurer.firstElementChild as HTMLElement).offsetHeight;

    // 5) Paginación lógica por contenido 
    const pages: string[] = [];
    let currentHtml = headerHtml;
    let usedHeight = headerHeight;

    for (const { cap, secciones, tablasPorSeccion } of capítulosConSecciones) {

      //forzar página nueva al iniciar un capítulo
      if (currentHtml !== headerHtml) {
        pages.push(currentHtml);
        currentHtml = headerHtml;
        usedHeight = headerHeight;
      }

      // Bloque de título de capítulo
      const titleBlock = `
        <div class="section-block">
          <h3>${cap.titulo}</h3>
        </div>
      `;
      measurer.innerHTML = titleBlock;
      const hTitle = (measurer.firstElementChild as HTMLElement).offsetHeight;
      if (usedHeight + hTitle > pageHeightPx) {
        pages.push(currentHtml);
        currentHtml = headerHtml + titleBlock;
        usedHeight = headerHeight + hTitle;
      } else {
        currentHtml += titleBlock;
        usedHeight += hTitle;
      }

      // Bloques de sección con imágenes y tablas
      secciones.forEach((sec, i) => {

        // DEPURACIÓN
        const lines = sec.contenido
          .split('\n')
          .map(l => l.trim())
          .filter(l => l);
        console.log(`[DEBUG] Sección #${i}`, {
          estilo: sec.styleTemplateNombre,
          totalLíneas: lines.length,
          contenido: sec.contenido
        });

        // Generar HTML según estilo
        let contentHtml: string;
        switch (sec.styleTemplateNombre) {
          case 'titulo':
            contentHtml = `
        <div style="
          font-size: 19px;
          font-weight: bold;
          text-decoration: underline;
          margin: 0 0 .5em 0;
        ">${sec.contenido}</div>`;
            break;

          case 'subtitulo':
            contentHtml = `
        <div style="
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 .4em 0;
        ">${sec.contenido}</div>`;
            break;

          case 'viñeta':
            if (lines.length < 2) {
              console.warn(`[DEBUG] Sólo ${lines.length} línea(s): no se aplica viñeta.`);
              contentHtml = `<p>${sec.contenido}</p>`;
            } else {
              contentHtml = `
          <ul style="
            display: table;
            margin: 0 auto 1em;
            padding-left: 8mm;
            list-style-type: disc;
            list-style-position: outside;
          ">
            ${lines.map(item => `
              <li style="
                font-size: 18px;
                line-height: 1.2;
                padding-left: 2mm;
                text-indent: -2mm;
                margin: 0 0 .1em 0;
              ">
                <span style="font-size: 12px;">${item}</span>
              </li>
            `).join('')}
          </ul>`;
            }
            break;

          default:
            contentHtml = `<p>${sec.contenido}</p>`;
        }

        // Tablas
        const tablasHtml = tablasPorSeccion[i]
          .map(t => `
      <div class="tabla-titulo">${t.nombre}</div>
      <table><tbody>
        ${t.filas.map(f => `
          <tr>${f.celdas.map(c => `<td>${c.contenido}</td>`).join('')}</tr>
        `).join('')}
      </tbody></table>
    `).join('');

        // Imágenes
        const imgsCount = sec.adjuntos?.length ?? 0;
        const cols = imgsCount > 1 ? `repeat(${imgsCount}, 1fr)` : '1fr';

        const block = `
    <div class="section-block">
      ${contentHtml}
      <div class="images-wrapper" style="
        display: grid;
        grid-template-columns: ${cols};
        gap: 5mm;
        margin-bottom: 1em;
      ">
        ${sec.adjuntos?.map(a => `
          <img src="${a.urlAdjunto}" style="
            width: 100%; height: auto; object-fit: cover;
            border: 1px solid #ccc; border-radius: 4px;
          " />
        `).join('')}
      </div>
      ${tablasHtml}
    </div>
  `;

        // Medir y paginar
        measurer.innerHTML = block;
        const bh = (measurer.firstElementChild as HTMLElement).offsetHeight;
        if (usedHeight + bh > pageHeightPx) {
          pages.push(currentHtml);
          currentHtml = headerHtml + block;
          usedHeight = headerHeight + bh;
        } else {
          currentHtml += block;
          usedHeight += bh;
        }

      });

    }

    if (currentHtml) {
      pages.push(currentHtml);
    }
    document.body.removeChild(measurer);

    // 6) Construir HTML final con estilos inyectados <<< CAMBIO
    const total = pages.length;
    const pagesHtml = pages.map((pg, idx) => `
  <div class="page">
    ${pg}
    <div style="
      position: absolute;
      bottom: 5mm;
      right: 10mm;
      font-size: 10px;
    ">
      Hoja ${idx + 1} de ${total}
    </div>
  </div>
`).join('');
    const previewId = `preview-zoom-${Date.now()}`;
    const html = `
  <style class="swal2-previsualizacion-a4">
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .report-header img { max-height: 50px; }
    .report-header .header-title {
      flex: 1; text-align: center; font-weight: bold; font-size: 14px;
    }
    .page {
      position: relative;
      width: 210mm; min-height: 297mm; padding: 10mm; box-sizing: border-box;
      background: white;
      page-break-after: always;
    }
    /* <<< CAMBIO 1: evitar que se partan bloques >>> */
    .section-block,
    .report-header,
    .tabla-titulo,
    table,
    .images-wrapper {
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .section-block { margin-bottom: 1em; }
    .section-block h3 { font-weight: bold; font-size: 20px; margin: 0 0 .5em; }
    .section-block p { text-align: justify; font-size: 12px; margin: 0 0 1em; }
    .tabla-titulo { font-size: 12px; font-weight: bold; margin: 0 0 .5em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
    td { border: 1px solid #000; padding: .2rem; font-size: 12px; }
    .images-wrapper {
      display: grid; grid-template-columns: repeat(2,1fr);
      gap: 5mm; margin-bottom: 1em;
    }
    .images-wrapper img:only-child {
      grid-column: 1/-1; justify-self: center;
    }
    @media print { .page { margin: 0; box-shadow: none; } }
  </style>
  <div id="${previewId}">${pagesHtml}</div>
`;

    // 7) Mostrar modal con panzoom y botón de PDF
    this.loading = false;
    let zoom: any;
    Swal.fire({
      title: `Preview: ${this.informe.titulo}`,
      html,
      width: 'auto',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      customClass: { popup: 'swal2-previsualizacion-a4' },
      didOpen: () => {
        const previewEl = document.getElementById(previewId)!;

        // Inyectar estilos dentro del contenedor
        const styleTag = document.querySelector('style.swal2-previsualizacion-a4')!;
        previewEl.prepend(styleTag);

        zoom = panzoom(previewEl, { maxZoom: 3, minZoom: 1, bounds: true, boundsPadding: 0.1 });
        const actions = Swal.getActions()!;

        const btn = document.createElement('button');
        btn.textContent = 'Descargar PDF';
        btn.className = 'swal2-styled';
        btn.style.marginRight = '0.5rem';
        btn.onclick = () => {
          // Filtrar páginas vacías
          const filtered = pages.filter(pg => {
            const content = pg
              .replace(headerHtml, '')
              .replace(/<div style="position:[\s\S]*?<\/div>/, '')
              .trim();
            return content !== '';
          });
          const total = filtered.length;
          const pagesHtmlFiltered = filtered.map((pg, idx) => `
        <div class="page">
          ${pg}
          <div style="
            position: absolute;
            bottom: 5mm;
            right: 10mm;
            font-size: 10px;
          ">
            Hoja ${idx + 1} de ${total}
          </div>
        </div>
      `).join('');

          // Reconstruir el contenido con CSS reforzado
          previewEl.innerHTML = `
        <style class="swal2-previsualizacion-a4">
          /* Encabezado igual que en preview */
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .report-header img {
            max-height: 50px;
          }
          .report-header .header-title {
            flex: 1;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
          }
          /* Página A4 y overflow */
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            box-sizing: border-box;
            overflow: hidden;
            page-break-after: always;
          }
          /* Evitar cortes internos */
          .section-block,
          .report-header,
          .tabla-titulo,
          table,
          .images-wrapper {
            break-inside: avoid-page;
            page-break-inside: avoid;
          }
          /* Imágenes contenidas */
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          /* Texto dentro de márgenes */
          p, div {
            word-break: break-word;
            hyphens: auto;
          }
          /* Resto de estilos… */
        </style>
        <div id="${previewId}">${pagesHtmlFiltered}</div>
      `;

          // Generar PDF forzando ancho igual al del preview
          html2pdf()
            .from(previewEl)
            .set({
              margin: [0, 0, 0, 0],
              filename: `${this.informe.titulo}.pdf`,
              html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                width: previewEl.offsetWidth,
                windowWidth: previewEl.offsetWidth
              },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
              pagebreak: { mode: ['css'], after: '.page' }
            })
            .save();
        };
        actions.insertBefore(btn, actions.firstChild);
      },
      willClose: () => {
        // Limpia sin recargar
        document.querySelectorAll('style.swal2-previsualizacion-a4').forEach(el => el.remove());
        if (zoom?.dispose) zoom.dispose();
      }
    });

  }
}