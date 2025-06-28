// src/app/seccion/seccion.component.ts
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { SeccionService } from '../service/seccion.service';
import { StyleTemplateService } from '../style-template/service/style-template.service';
import { CapituloService } from '../service/capitulo.service';
import { InformeAuditoriaService } from '../service/informe-auditoria.service';
import { TablaService } from '../service/tabla.service';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { SeccionDTO } from '../models/seccion-dto';
import { CeldaDTO, FilaDTO, TablaDTO } from '../models/tabla-dto.model';
import { TypoService } from '../../services/typo.service';
import { firstValueFrom, forkJoin, map, of, switchMap } from 'rxjs';
import panzoom from "@panzoom/panzoom";
import html2pdf from "html2pdf.js";
import { AdjuntosService } from '../../utils/adjuntos.service';
import { Router } from '@angular/router';
import { SpinnerComponent } from "../../utils/spinner/spinner.component";
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { EncabezadoService } from '../service/encabezado.service';

interface SeccionView extends SeccionDTO {
  organizacionId?: number;
  razonSocial?: string;
  styleTemplateNombre?: string;
  adjuntos?: { id: number; urlAdjunto: string }[];
}

@Component({
  selector: 'app-seccion',
  standalone: true,
  imports: [
    NavComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SpinnerComponent,
    DragDropModule
  ],
  templateUrl: './seccion.component.html',
  styleUrls: ['./seccion.component.css']
})
export class SeccionComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  seccionForm: FormGroup;
  secciones: SeccionView[] = [];
  editarId: number | null = null;
  capituloId!: number;
  styleTemplates: { id: number; nombre: string }[] = [];
  tablas: TablaDTO[] = [];
  showTableModal = false;
  selectedTabla: TablaDTO | null = null;
  capituloTitulo: string = '';
  informeTitulo: string = '';
  informeRazonSocial: string = '';
  errores: { palabra: string; sugerencias: string[] }[] = [];
  pdfSrc?: string;
  showPdf = false;
  uploadFiles: File[] = [];
  adjuntosIds: number[] = [];
  mostrarAdjuntos: Record<number, boolean> = {};
  informeId!: number;
  organizacionId?: number;
  loading = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private seccionService: SeccionService,
    private adjuntosService: AdjuntosService,
    private styleTemplateService: StyleTemplateService,
    private capService: CapituloService,
    private infService: InformeAuditoriaService,
    private tablaService: TablaService,
    private typo: TypoService,
    private router: Router,
    private encabezadoService: EncabezadoService,
  ) {
    this.seccionForm = this.fb.group({
      contenido: ['', Validators.required],
      orden: [1, [Validators.required, Validators.min(1),
      this.uniqueOrdenValidator()
      ]],
      styleTemplateId: [null, Validators.required]
    });
  }

  triggerFileSelect(): void {
    this.fileInput.nativeElement.click();
  }

  //Carga de imagenes
  onFileSelected(event: Event, seccionId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    // Comprobación de límite
    const secc = this.secciones.find(x => x.id === seccionId);
    const actuales = secc?.adjuntos?.length ?? 0;
    if (actuales >= 2) {
      Swal.fire('Atención', 'Ya tienes dos imágenes. No puedes subir más.', 'warning');
      input.value = '';
      return;
    }

    this.loading = true;
    this.adjuntosService
      .ploadAdjuntoSeccion(file, file.name, seccionId)
      .subscribe({
        next: () => {
          Swal.fire('Listo', 'Imagen cargada correctamente.', 'success');
          this.cargarSecciones();
          input.value = '';
        },
        error: () => {
          Swal.fire('Error', 'No se pudo subir la imagen.', 'error');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  async ngOnInit(): Promise<void> {
    await this.typo.init();
    this.seccionForm.get('contenido')!
      .valueChanges
    this.capituloId = Number(this.route.snapshot.paramMap.get('capituloId'));
    if (!this.capituloId) {
      return;
    }

    this.capService.getById(this.capituloId).subscribe({
      next: cap => {
        this.capituloTitulo = cap.titulo ?? '';
        this.infService.getById(cap.informeId!).subscribe({
          next: inf => {
            this.informeId = inf.id!;
            this.informeTitulo = inf.titulo;
            this.informeRazonSocial = inf.razonSocial;
            this.organizacionId = inf.organizacionId;
            this.cargarStyleTemplates();
            this.cargarSecciones();
          },
          error: err => Swal.fire('Error', 'No se pudo cargar el informe', 'error')
        });
      },
      error: err => Swal.fire('Error', 'No se pudo cargar el capítulo', 'error')
    });
  }

  private cargarStyleTemplates(): void {
    this.styleTemplateService.findAll().subscribe({
      next: data => this.styleTemplates = data,
      error: err => console.error('Error plantillas:', err)
    });
  }

  private getNextOrdenSeccion(): number {
    if (!this.secciones.length) return 1;
    const max = Math.max(...this.secciones.map(s => s.orden));
    return max + 1;
  }


  private cargarSecciones(): void {
    this.loading = true;
    this.seccionService.getAll().subscribe({
      next: data => {
        this.secciones = data
          .filter(s => s.capituloId === this.capituloId)
          .sort((a, b) => a.orden - b.orden);
        // actualizar validador y valor por defecto
        this.seccionForm.get('orden')!.updateValueAndValidity();
        if (this.editarId == null) {
          this.seccionForm.get('orden')!.setValue(this.getNextOrdenSeccion());
        }
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        console.error(err);
        Swal.fire('Error', 'No se pudieron cargar las secciones.', 'error');
      }
    });
  }


  onArchivosSeleccionados(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFiles = input.files ? Array.from(input.files) : [];
  }

  onSubmit(): void {
    // 1) Validar orden único
    const ordenIngresado = this.seccionForm.value.orden;
    const dup = this.secciones.some(s =>
      s.orden === ordenIngresado && (this.editarId == null || s.id !== this.editarId)
    );
    if (dup) {
      Swal.fire('Orden repetido', 'Ya existe una sección con ese orden.', 'error');
      return;
    }
    // 2) Validar formulario
    if (this.seccionForm.invalid) return;
    // 3) Construir payload
    const payload: SeccionDTO = {
      contenido: this.seccionForm.value.contenido,
      orden: ordenIngresado,
      capituloId: this.capituloId,
      organizacionId: this.organizacionId,
      styleTemplateId: this.seccionForm.value.styleTemplateId,
      adjuntosIds: []    // sin adjuntos aquí; se suben después
    };
    // 4) Elegir create o update
    const request$ = this.editarId === null
      ? this.seccionService.createSeccion(payload)
      : this.seccionService.updateSeccion(this.editarId, payload);
    // 5) Ejecutar y, si hay archivos, subirlos
    request$.pipe(
      switchMap(sec => {
        if (!this.uploadFiles.length) return of(sec);
        const uploads$ = this.uploadFiles.map(file =>
          this.seccionService.uploadAdjunto(file, sec.id!)
        );
        return forkJoin(uploads$).pipe(map(() => sec));
      })
    ).subscribe({
      next: sec => {
        // 6) Refrescar lista y limpiar estado
        this.cargarSecciones();
        this.uploadFiles = [];
        Swal.fire(
          'Éxito',
          `Sección ${this.editarId === null ? 'creada' : 'actualizada'} correctamente.`,
          'success'
        );
        if (this.editarId !== null) {
          this.cancelarEdicion();
        } else {
          this.seccionForm.reset({ contenido: '', orden: 1, styleTemplateId: null });
        }
      },
      error: err => {
        Swal.fire('Error', 'No se pudo procesar la sección o subir imágenes.', 'error');
      }
    });
  }

  cancelarEdicion(): void {
    this.editarId = null;
    this.seccionForm.reset({
      contenido: '',
      orden: this.getNextOrdenSeccion(),
      styleTemplateId: null
    });
    this.adjuntosIds = [];
    this.closeTableModal();
  }


  eliminarSeccion(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la sección de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.seccionService.deleteSeccion(id).subscribe({
          next: () => {
            this.secciones = this.secciones.filter(s => s.id !== id);
            Swal.fire('Eliminada', 'La sección ha sido eliminada.', 'success');
          },
          error: err => {
            Swal.fire('Error', 'No se pudo eliminar la sección.', 'error');
          }
        });
      }
    });
  }

  editarSeccion(s: SeccionView): void {
    this.editarId = s.id!;
    this.seccionForm.patchValue({
      contenido: s.contenido,
      orden: s.orden,
      styleTemplateId: s.styleTemplateId
    });
    this.adjuntosIds = s.adjuntos?.map(a => a.id) || [];
    // <- obliga a que Angular vuelva a ejecutar uniqueOrdenValidator
    this.seccionForm.get('orden')?.updateValueAndValidity();
  }

  openOpcionesTabla(s: SeccionView): void {
    this.editarSeccion(s);
    Swal.fire({
      title: '¿Qué deseas hacer?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Crear tabla',
      denyButtonText: 'Editar contenido',
      cancelButtonText: 'Eliminar tabla'
    }).then(res => {
      if (res.isConfirmed) {
        this.openCrearTabla();
      } else if (res.isDenied) {
        this.openEditarTabla();
      } else if (res.dismiss === Swal.DismissReason.cancel) {
        this.openEliminarTabla();
      }
    });
  }

  // Nuevo método para eliminar
  openEliminarTabla(): void {
    if (!this.editarId) {
      Swal.fire('Atención', 'Guardá sección primero.', 'warning');
      return;
    }

    // Mostrar spinner mientras cargan las tablas
    this.loading = true;
    this.tablaService.getTablasPorSeccion(this.editarId).subscribe({
      next: tablas => {
        this.loading = false;  // ocultar spinner tras obtener lista

        if (tablas.length === 0) {
          Swal.fire('Info', 'No hay tablas para eliminar.', 'info');
          return;
        }
        const html = tablas
          .map(t => `
          <div class="d-flex justify-content-between mb-2">
            <span>${t.nombre}</span>
            <button id="del-${t.id}" class="btn btn-sm btn-danger">Borrar</button>
          </div>
        `).join('');

        Swal.fire({
          title: 'Seleccioná la tabla a eliminar',
          html,
          showCloseButton: true,
          showConfirmButton: false,
          width: '400px'
        });

        const container = Swal.getHtmlContainer()!;
        tablas.forEach(t => {
          container
            .querySelector<HTMLButtonElement>(`#del-${t.id}`)!
            .addEventListener('click', () => {
              // 1) Activa spinner hasta respuesta de borrado
              this.loading = true;
              this.tablaService.deleteTabla(t.id!).subscribe({
                next: () => {
                  this.loading = false;  // oculta spinner
                  Swal.fire('Eliminada', `La tabla "${t.nombre}" fue borrada.`, 'success');
                  this.cargarSecciones(); // refresca vista
                  Swal.close();           // cierra el modal de selección
                },
                error: () => {
                  this.loading = false;  // oculta spinner
                  Swal.fire('Error', 'No se pudo eliminar la tabla.', 'error');
                }
              });
            });
        });
      },
      error: () => {
        this.loading = false;  // oculta spinner si falla
        Swal.fire('Error', 'No se pudieron cargar las tablas.', 'error');
      }
    });
  }
  //Modal de tabla
  openOpcionesMatriz(s: SeccionView): void {
    this.editarSeccion(s);
    this.showTableModal = false;
    Swal.fire({
      title: '¿Qué deseas hacer?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Causa efecto',
      denyButtonText: 'Evaluación de impacto'
    }).then(res => {
      const id = s.id ?? this.editarId;
      if (!id) {
        Swal.fire('Error', 'La sección no tiene ID definido', 'error');
        return;
      }
      if (res.isConfirmed) {
        this.router.navigate([
          'matriz-causa-efecto-v1-visualizacion',
          s.razonSocial,
          id
        ]);
      } else if (res.isDenied) {
        this.router.navigate([
          'matriz-impacto',
          s.razonSocial,
          id
        ]);
      }
    });
  }

  openCrearTabla(): void {
    if (!this.editarId) {
      Swal.fire('Atención', 'Guardá sección primero.', 'warning');
      return;
    }
    Swal.fire({
      title: 'Crear tabla',
      html:
        `<input id="swal-nombre" class="swal2-input" placeholder="Nombre">` +
        `<input id="swal-filas" type="number" min="1" class="swal2-input" placeholder="Filas">` +
        `<input id="swal-columnas" type="number" min="1" class="swal2-input" placeholder="Columnas">`,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const nombre = (document.getElementById('swal-nombre') as HTMLInputElement).value;
        const filas = parseInt((document.getElementById('swal-filas') as HTMLInputElement).value, 10);
        const cols = parseInt((document.getElementById('swal-columnas') as HTMLInputElement).value, 10);
        if (!nombre || filas < 1 || cols < 1) {
          Swal.showValidationMessage('Nombre, filas y columnas son requeridos');
          return;
        }
        return { nombre, filas, cols };
      }
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const { nombre, filas, cols } = res.value;
        this.tablaService.crearTabla(filas, cols, this.editarId!, nombre).subscribe({
          next: t => {
            Swal.fire('¡Listo!', 'Tabla creada.', 'success');
            this.openEditarTabla();
          },
          error: () => Swal.fire('Error', 'No se pudo crear.', 'error')
        });
      }
    });
  }

  private openEditarTabla(): void {
    if (!this.editarId) {
      Swal.fire('Atención', 'Guardá sección primero.', 'warning');
      return;
    }
    this.tablaService.getTablasPorSeccion(this.editarId).subscribe({
      next: tablas => {
        this.tablas = tablas;
        if (tablas.length === 0) {
          Swal.fire('Info', 'No hay tablas para esta sección.', 'info');
          return;
        }
        // Selecciono la primera tabla (o podrías mostrar un selector)
        this.selectedTabla = tablas[0];
        this.showTableModal = true;
        Swal.fire('Edición', 'En esta ventana podes editar el contendido de la tabla.', 'info');
      },
      error: err => {
        Swal.fire('Error', 'No se pudieron cargar las tablas.', 'error');
      }
    });
  }

  private cargarTablas(): void {
    if (!this.editarId) return;
    this.loading = true;  // muestra el spinner
    this.tablaService.getTablasPorSeccion(this.editarId).subscribe({
      next: tablas => {
        this.tablas = tablas;
        this.loading = false;  // oculta el spinner
      },
      error: err => {
        this.loading = false;  // oculta el spinner
        console.error('Error tablas:', err);
        Swal.fire('Error', 'No se pudieron cargar las tablas.', 'error');
      }
    });
  }

  guardarEdicion(tabla: TablaDTO): void {
    const celdas: CeldaDTO[] = tabla.filas.flatMap(f => f.celdas);
    this.loading = true;  // ← muestra el spinner
    this.tablaService.editarCeldas(celdas).subscribe({
      next: () => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('¡Listo!', 'Tabla actualizada.', 'success');
      },
      error: () => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Error', 'No se pudo actualizar.', 'error');
      }
    });
  }

  //abre tabla modal
  openTableModal(tabla: TablaDTO): void {
    this.selectedTabla = tabla;
    this.showTableModal = true;
  }
  //cierra modal
  closeTableModal(): void {
    this.showTableModal = false;
    this.selectedTabla = null;
  }
  //guarda modal
  saveModal(): void {
    if (!this.selectedTabla) return;
    const celdas: CeldaDTO[] = this.selectedTabla.filas.flatMap(f => f.celdas);
    this.loading = true;  // ← muestra el spinner
    this.tablaService.editarCeldas(celdas).subscribe({
      next: () => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('¡Listo!', 'Tabla actualizada.', 'success');
        this.closeTableModal();
        this.cargarTablas();
      },
      error: () => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Error', 'No se pudo actualizar.', 'error');
      }
    });
  }

  //Area de texto
  adjustTextarea(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  private uniqueOrdenValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const orden = control.value;
      if (!orden) return null;
      const exists = this.secciones.some(s => s.orden === orden && s.id !== this.editarId);
      return exists ? { ordenExists: true } : null;
    };
  }

  getColumnName(index: number): string {
    let name = '';
    let i = index + 1;
    while (i > 0) {
      const mod = (i - 1) % 26;
      name = String.fromCharCode(65 + mod) + name;
      i = Math.floor((i - 1) / 26);
    }
    return name;
  }


  async previewCapitulo(): Promise<void> {
    // 0) Cerrar modal existente y limpiar resto
    if (Swal.isVisible()) {
      Swal.close();
    }
    document
      .querySelectorAll('#preview-zoom, style.swal2-previsualizacion-a4, .swal2-container')
      .forEach(el => el.remove());

    this.loading = true;

    // 1) Traer encabezados y construir headerHtml
    const encabezados = await firstValueFrom(
      this.encabezadoService.getByInformeId(this.informeId)
    );
    const todosAdj = encabezados.flatMap(e => e.adjuntos);
    const logoIzq = todosAdj[0]?.urlAdjunto || '';
    const logoDer = todosAdj[1]?.urlAdjunto || '';
    const textoEncabezado = encabezados[0]?.contenido || '';
    const headerHtml = `
    <div class="report-header">
      <img src="${logoIzq}" alt="Logo IZQ">
      <div class="header-title">${textoEncabezado}</div>
      <img src="${logoDer}" alt="Logo DER">
    </div>
  `;

    // 2) Preparar medidor oculto
    const pxPorMm = (mm: number) => (mm / 25.4) * 96;
    const pageHeight = pxPorMm(297 - 20);
    const measurer = document.createElement('div');
    Object.assign(measurer.style, {
      position: 'absolute',
      visibility: 'hidden',
      width: `${pxPorMm(210 - 20)}px`
    });
    document.body.appendChild(measurer);
    measurer.innerHTML = headerHtml;
    const headerH = (measurer.firstElementChild as HTMLElement).offsetHeight;

    // 3) Ordenar secciones y traer tablas
    const seccionesOrdenadas = [...this.secciones]
      .map(sec => ({ ...sec, orden: Number(sec.orden) }))
      .sort((a, b) => a.orden - b.orden);
    const tablasPorSeccion = await Promise.all(
      seccionesOrdenadas.map(s => firstValueFrom(this.tablaService.getTablasPorSeccion(s.id!)))
    );

    // 4) Generar páginas con encabezado en cada una
    const pages: string[] = [];
    let currentHtml = headerHtml;
    let usedHeight = headerH;

    for (let i = 0; i < seccionesOrdenadas.length; i++) {
      const sec = seccionesOrdenadas[i];

      // Contenido según template
      const lines = sec.contenido.split('\n').map(l => l.trim()).filter(l => l);
      let contentHtml: string;
      switch (sec.styleTemplateNombre) {
        case 'titulo':
          contentHtml = `<div style="font-size:19px;font-weight:bold;text-decoration:underline;margin:0 0 .5em">${sec.contenido}</div>`;
          break;
        case 'subtitulo':
          contentHtml = `<div style="font-size:16px;font-weight:bold;margin:0 0 .4em">${sec.contenido}</div>`;
          break;
        case 'viñeta':
          contentHtml = lines.length < 2
            ? `<p>${sec.contenido}</p>`
            : `<ul style="display:table;margin:0 auto 1em;padding-left:8mm;list-style-type:disc;list-style-position:outside">
              ${lines.map(item => `<li style="font-size:12px;line-height:1.2;margin:0 0 .1em;padding-left:2mm;text-indent:-2mm">${item}</li>`).join('')}
            </ul>`;
          break;
        default:
          contentHtml = `<p>${sec.contenido}</p>`;
      }

      // Tablas
      const tablasHtml = tablasPorSeccion[i].map(t => `
      <div class="tabla-titulo">${t.nombre}</div>
      <table><tbody>
        ${t.filas.map(f =>
        `<tr>${f.celdas.map(c => `<td>${c.contenido}</td>`).join('')}</tr>`
      ).join('')}
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
          width: 100%;
          height: auto;
          object-fit: cover;
          border: 1px solid #ccc;
          border-radius: 4px;
        " />
      `).join('') ?? ''}
    </div>
    ${tablasHtml}
  </div>
`;
      measurer.innerHTML = block;
      const bh = (measurer.firstElementChild as HTMLElement).offsetHeight;

      if (usedHeight + bh > pageHeight) {
        pages.push(currentHtml);
        currentHtml = headerHtml + block;
        usedHeight = headerH + bh;
      } else {
        currentHtml += block;
        usedHeight += bh;
      }
    }

    if (currentHtml) pages.push(currentHtml);
    document.body.removeChild(measurer);

    // 5) Construir HTML final con CSS idéntico a previewInforme()
    const total = pages.length;
    const pagesHtml = pages.map((pg, idx) => `
    <div class="page">
      ${pg}
      <div style="position:absolute;bottom:5mm;right:10mm;font-size:10px">
        Hoja ${idx + 1} de ${total}
      </div>
    </div>
  `).join('');
    const previewId = `preview-zoom-${Date.now()}`;
    const html = `
    <style class="swal2-previsualizacion-a4">
      .report-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
      .report-header img { max-height:50px; }
      .report-header .header-title { flex:1; text-align:center; font-weight:bold; font-size:14px; }

      .page {
        position:relative;
        width:210mm;
        min-height:297mm;
        padding:10mm;
        box-sizing:border-box;
        background:white;
        page-break-after:always;
      }

      .section-block,
      .report-header,
      .tabla-titulo,
      table,
      .images-wrapper {
        break-inside:avoid-page;
        page-break-inside:avoid;
      }
      .section-block { margin-bottom:1em; }
      .section-block h3 { font-weight:bold; font-size:20px; margin:0 0 .5em; }
      .section-block p { text-align:justify; font-size:12px; margin:0 0 1em; }

      .tabla-titulo { font-size:12px; font-weight:bold; margin:0 0 .5em; }
      table { width:100%; border-collapse:collapse; margin-bottom:1em; }
      td { border:1px solid #000; padding:.2rem; font-size:12px; }

      .images-wrapper {
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:5mm;
        margin-bottom:1em;
      }
      .images-wrapper img:only-child {
        grid-column:1/-1;
        justify-self:center;
      }

      @media print {
        .page { margin:0; box-shadow:none; }
      }
    </style>
    <div id="${previewId}">${pagesHtml}</div>
  `;

    // 6) Mostrar modal con panzoom y botón de descarga PDF
    this.loading = false;
    Swal.fire({
      title: `Preview: ${this.capituloTitulo}`,
      html,
      width: 'auto',
      showCloseButton: true,
      confirmButtonText: 'Cerrar',
      customClass: { popup: 'swal2-previsualizacion-a4' },
      didOpen: () => {
        const el = document.getElementById(previewId)!;
        el.prepend(document.querySelector('style.swal2-previsualizacion-a4')!);
        panzoom(el, { maxZoom: 3, minZoom: 1, bounds: true, boundsPadding: 0.1 });
        const actions = Swal.getActions()!;
        const btn = document.createElement('button');
        btn.textContent = 'Descargar PDF';
        btn.className = 'swal2-styled';
        btn.style.marginRight = '0.5rem';
        btn.onclick = () => html2pdf()
          .from(el)
          .set({
            margin: [0, 0, 0, 0],
            filename: `${this.capituloTitulo}.pdf`,
            html2canvas: { scale: 2, useCORS: true, allowTaint: true, width: el.offsetWidth, windowWidth: el.offsetWidth },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css'], after: '.page' }
          })
          .save();
        actions.insertBefore(btn, actions.firstChild);
      },
      willClose: () => {
        document.querySelectorAll('style.swal2-previsualizacion-a4').forEach(e => e.remove());
      }
    });
  }




  // dentro de SeccionComponent
  private crearSeccion(): void {
    const payload: SeccionDTO = {
      contenido: this.seccionForm.get('contenido')!.value,
      orden: this.seccionForm.get('orden')!.value,
      capituloId: this.capituloId,
      organizacionId: this.organizacionId,
      styleTemplateId: this.seccionForm.get('styleTemplateId')!.value,
      adjuntosIds: this.adjuntosIds
    };

    this.loading = true;  // ← muestra el spinner
    this.seccionService.createSeccion(payload).subscribe({
      next: sec => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Éxito', 'Sección creada con ID ' + sec.id, 'success');
        this.cargarSecciones();
      },
      error: err => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Error', 'No se pudo crear la sección', 'error');
      }
    });
  }
  // --- Borar imagen ---
  public onDeleteAdjunto(adjuntoId: number): void {
    Swal.fire({
      title: '¿Eliminar imagen?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.loading = true;  // ← muestra el spinner
        this.adjuntosService.deleteAdjunto(adjuntoId).subscribe({
          next: () => {
            this.loading = false;  // ← oculta el spinner
            Swal.fire('Eliminada', 'La imagen ha sido borrada.', 'success');
            // Refrescar lista localmente
            this.secciones = this.secciones.map(s => ({
              ...s,
              adjuntos: s.adjuntos?.filter(a => a.id !== adjuntoId)
            }));
          },
          error: err => {
            this.loading = false;  // ← oculta el spinner
            Swal.fire('Error', 'No se pudo eliminar la imagen.', 'error');
          }
        });
      }
    });
  }
  /** Abre un SweetAlert mostrando miniaturas y permite borrar al vuelo */
  verAdjuntos(s: SeccionView): void {
    // Mostrar spinner hasta que abra el modal
    this.loading = true;

    const html = s.adjuntos!
      .map(a => `
      <div class="d-flex align-items-center mb-2">
        <img src="${a.urlAdjunto}" style="max-height:100px; margin-right:1rem;" />
        <button class="btn btn-danger btn-sm" id="del-${a.id}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');

    Swal.fire({
      title: 'Adjuntos',
      html,
      showCloseButton: true,
      width: '600px',
      didOpen: () => {
        // Ya cargó el HTML, ocultamos spinner
        this.loading = false;

        const container = Swal.getHtmlContainer();
        if (!container) return;

        s.adjuntos!.forEach(a => {
          const btn = container.querySelector<HTMLButtonElement>(`#del-${a.id}`);
          btn?.addEventListener('click', () => {
            // Mostrar spinner mientras esperamos la respuesta de borrado
            this.loading = true;
            this.adjuntosService.deleteAdjunto(a.id).subscribe({
              next: () => {
                this.loading = false;
                Swal.fire('Eliminada', 'La imagen ha sido borrada.', 'success');
                // Actualizar el array y reabrir modal
                s.adjuntos = s.adjuntos!.filter(x => x.id !== a.id);
                Swal.close();
                setTimeout(() => this.verAdjuntos(s), 200);
              },
              error: () => {
                this.loading = false;
                Swal.fire('Error', 'No se pudo borrar la imagen.', 'error');
              }
            });
          });
        });
      }
    });
  }
  // --- Cambios en openImagenOptions ---
  openImagenOptions(s: SeccionView, fileInput: HTMLInputElement): void {
    this.editarSeccion(s);
    const actuales = s.adjuntos?.length ?? 0;
    if (actuales >= 2) {
      Swal.fire('Atención', 'Solo puedes cargar hasta dos imágenes.', 'warning');
      return;
    }
    Swal.fire({
      title: '¿Qué deseas hacer?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Cargar imagen',
      denyButtonText: 'Ver imágenes'
    }).then(res => {
      if (res.isConfirmed) {
        fileInput.click();
      } else if (res.isDenied) {
        this.loading = true;
        this.verAdjuntos(s);
      }
    });
  }
  // --- Drp de tabla ---
  drop(event: CdkDragDrop<SeccionView[], SeccionView[], any>): void {
    // reordena local
    moveItemInArray(this.secciones, event.previousIndex, event.currentIndex);
    // reasigna orden
    this.secciones.forEach((s, idx) => s.orden = idx + 1);
    // persiste vía API
    const updates = this.secciones.map(s => ({ id: s.id!, orden: s.orden }));
    this.seccionService.updateOrdenBulk(updates)
      .subscribe({
        next: () => Swal.fire('Listo', 'Orden actualizado.', 'success'),
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar el orden.', 'error');
          this.cargarSecciones();
        }
      });
  }

}