// src/app/seccion/seccion.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { CeldaDTO, TablaDTO } from '../models/tabla-dto.model';
import { TypoService } from '../../services/typo.service';
import {  forkJoin, map, of, switchMap } from 'rxjs';
import { AdjuntosService } from '../../utils/adjuntos.service';
import { Router } from '@angular/router';
import { SpinnerComponent } from "../../utils/spinner/spinner.component";
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { EncabezadoService } from '../service/encabezado.service';
import { InformeDTO } from '../models/informe-dto.models';

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
  mostrarFormulario = true;
  informe!: InformeDTO;

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  private normalizeContenidoForSave(raw: string | null | undefined): string {
  const txt = String(raw ?? '');
  // Unifica CRLF/CR en LF y recorta solo espacios de extremos (no internos)
  return txt.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}


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
            this.informe   = inf;
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

  // 3) Normalizar contenido (asegura \n para viñetas)
  const contenidoNorm = this.normalizeContenidoForSave(this.seccionForm.value.contenido);

  // Diagnóstico: confirmá que van \n
  console.log('DEBUG contenido:', JSON.stringify(contenidoNorm));

  // 4) Construir payload
  const payload: SeccionDTO = {
    contenido: contenidoNorm,
    orden: ordenIngresado,
    capituloId: this.capituloId,
    organizacionId: this.organizacionId,
    styleTemplateId: this.seccionForm.value.styleTemplateId,
    adjuntosIds: []    // sin adjuntos aquí; se suben después
  };

  // 5) Elegir create o update
  const request$ = this.editarId === null
    ? this.seccionService.createSeccion(payload)
    : this.seccionService.updateSeccion(this.editarId, payload);

  // 6) Ejecutar (y si hay archivos, subirlos)
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
        this.seccionForm.reset({
          contenido: '',
          orden: 1,
          styleTemplateId: null
        });
      }
    },
    error: () => {
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


  //Modal matriz
  // dentro de tu componente (seccion.component.ts)
  openOpcionesMatriz(s: SeccionView): void {
    this.editarSeccion(s);
    this.showTableModal = false;

    Swal.fire({
      title: '¿Qué deseas hacer?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Causa efecto',
      denyButtonText: 'Evaluación de impacto',
      cancelButtonText: 'Ponderación'
    }).then(res => {
      const id = s.id ?? this.editarId;
      if (!id) {
        Swal.fire('Error', 'La sección no tiene ID definido', 'error');
        return;
      }

      if (res.isConfirmed) {
        // Navegar a causa-efecto
        this.router.navigate([
          'matriz-causa-efecto-v1-visualizacion',
          s.razonSocial,
          id
        ]);
      } else if (res.isDenied) {
        // Navegar a evaluación de impacto
        this.router.navigate([
          'matriz-impacto',
          s.razonSocial,
          id
        ]);
      } else if (res.isDismissed) {
        // ← NUEVO: navegar a ponderación
        this.router.navigate([
          'matriz-ponderacion',
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

/**
 * Navega a la vista de previsualización de un informe concreto.
 * @param id El identificador del informe a previsualizar.
 */
onPreviewClick(id: number): void {
  this.router.navigate(['/informes', id, 'preview']);

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
  /**
   * Abre el modal de opciones de imagen:
   * - Permite ver y eliminar adjuntos SIEMPRE.
   * - Deshabilita "Cargar imagen" cuando ya hay 2 o más adjuntos.
   */
  openImagenOptions(s: SeccionView, fileInput: HTMLInputElement): void {
    // Aseguramos que estemos editando la sección correspondiente
    this.editarSeccion(s);

    // Contamos cuántos adjuntos hay
    const actuales = s.adjuntos?.length ?? 0;

    Swal.fire({
      title: '¿Qué deseas hacer?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Cargar imagen',
      denyButtonText: 'Ver imágenes',
      // Al abrir, deshabilitamos “Cargar imagen” si ya hay 2 o más
      didOpen: () => {
        if (actuales >= 2) {
          const btn = Swal.getConfirmButton();
          if (btn) {
            btn.setAttribute('disabled', 'true');
            btn.classList.add('swal2-styled--disabled');
          }
        }
      }
    }).then(res => {
      if (res.isConfirmed) {
        // Solo se ejecutará si hay menos de 2 adjuntos
        fileInput.click();
      } else if (res.isDenied) {
        // Siempre permitimos ver/eliminar adjuntos
        this.loading = true;
        this.verAdjuntos(s);
      }
      // res.dismiss (Cancel) simplemente cierra el diálogo
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