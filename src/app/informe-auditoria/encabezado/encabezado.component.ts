// src/app/encabezado/encabezado.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { EncabezadoService } from '../service/encabezado.service';
import { EncabezadoDTO } from '../models/encabezado-dto';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';
import { InformeAuditoriaService } from '../service/informe-auditoria.service';
import { InformeDTO } from '../models/informe-dto.models';
import { AdjuntosService } from '../../utils/adjuntos.service';

export type EncabezadoView = Omit<EncabezadoDTO, 'adjuntos'> & {
  /** Lista de adjuntos locales, puede venir indefinida */
  adjuntos?: { id: number; urlAdjunto: string }[];
};

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [
    NavComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SpinnerComponent
  ],
  templateUrl: './encabezado.component.html',
  styleUrls: ['./encabezado.component.css']
})
export class EncabezadoComponent implements OnInit {
  encabezados: EncabezadoDTO[] = [];
  form: FormGroup;
  editarId: number | null = null;
  informeId!: number;
  loading = false;
  informeTitulo = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private svc: EncabezadoService,
    private informeService: InformeAuditoriaService,
        private adjuntosService: AdjuntosService
  ) {
    this.form = this.fb.group({
      contenido: ['', Validators.required],
      styleTemplateId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.informeId = Number(this.route.snapshot.paramMap.get('informeId'));
    if (!this.informeId) {
      Swal.fire('Error','No hay informe asociado','error');
      return;
    }

    // 1) Traer el título del informe
    this.informeService.getById(this.informeId).subscribe({
      next: (inf: InformeDTO) => this.informeTitulo = inf.titulo,
      error: () => Swal.fire('Error','No se pudo cargar el título del informe','error')
    });

    // 2) Cargar encabezados
    this.cargarTodos();
  }

  private cargarTodos(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: list => {
        this.encabezados = list.filter(e => e.informeId === this.informeId);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar encabezados', 'error');
      }
    });
  }

  editar(e: EncabezadoDTO): void {
    this.editarId = e.id!;
    this.form.patchValue({
      contenido: e.contenido,
      styleTemplateId: e.styleTemplateId
    });
  }

  cancelar(): void {
    this.editarId = null;
    this.form.reset({ contenido: '', styleTemplateId: null });
  }

  submit(): void {
    if (this.form.invalid) return;
    const dto: EncabezadoDTO = {
      ...this.form.value,
      informeId: this.informeId,
      id: this.editarId ?? undefined,
      adjuntos: [],
      adjuntosIds: [],
      createdBy: '', createdDate: '', lastModifiedBy: '', lastModifiedDate: ''
    } as any;
    this.loading = true;
    const pet = this.editarId
      ? this.svc.updateEncabezado(this.editarId, dto)
      : this.svc.createEncabezado(dto);
    pet.subscribe({
      next: () => {
        Swal.fire('Listo', `Encabezado ${this.editarId ? 'actualizado' : 'creado'}`, 'success');
        this.cancelar();
        this.cargarTodos();
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo guardar', 'error');
      },
      complete: () => this.loading = false
    });
  }

  borrar(id: number): void {
    Swal.fire({
      title: '¿Eliminar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar'
    }).then(res => {
      if (res.isConfirmed) {
        this.loading = true;
        this.svc.deleteEncabezado(id).subscribe({
          next: () => {
            Swal.fire('Borrado', 'Encabezado eliminado', 'success');
            this.cargarTodos();
          },
          error: () => {
            this.loading = false;
            Swal.fire('Error', 'No se pudo eliminar', 'error');
          }
        });
      }
    });
  }

    // ----- IMÁGENES -----
  onFileSelected(event: Event, encabezadoId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const enc = this.encabezados.find(x => x.id === encabezadoId);
    const actuales = enc?.adjuntos?.length ?? 0;
    if (actuales >= 2) {
      Swal.fire('Atención','Ya tienes dos imágenes.','warning');
      input.value = '';
      return;
    }
    this.loading = true;
    this.adjuntosService.ploadAdjuntoEncabezado(file, file.name, encabezadoId)
      .subscribe({
        next: () => {
          Swal.fire('Listo','Imagen cargada','success');
          this.cargarTodos();
          input.value = '';
        },
        error: () => Swal.fire('Error','No se pudo subir la imagen','error'),
        complete: () => this.loading = false
      });
  }

  openImagenOptions(e: EncabezadoView, fileInput: HTMLInputElement): void {
    const actuales = e.adjuntos?.length ?? 0;
    if (actuales >= 2) {
      Swal.fire('Atención','Solo 2 imágenes permitidas','warning');
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
        this.verAdjuntos(e);
      }
    });
  }

  verAdjuntos(e: EncabezadoView): void {
    this.loading = true;
    const html = e.adjuntos!
      .map(a => `
        <div class="d-flex align-items-center mb-2">
          <img src="${a.urlAdjunto}" style="max-height:100px; margin-right:1rem;" />
          <button class="btn btn-danger btn-sm" id="del-${a.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>`)
      .join('');
    Swal.fire({ title: 'Adjuntos', html, showCloseButton: true, width: '600px',
      didOpen: () => {
        this.loading = false;
        const container = Swal.getHtmlContainer()!;
        e.adjuntos!.forEach(a => {
          container.querySelector<HTMLButtonElement>(`#del-${a.id}`)!
            .addEventListener('click', () => this.onDeleteAdjunto(a.id));
        });
      }
    });
  }

  onDeleteAdjunto(adjuntoId: number): void {
    Swal.fire({
      title: '¿Eliminar imagen?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar'
    }).then(res => {
      if (res.isConfirmed) {
        this.loading = true;
        this.adjuntosService.deleteAdjunto(adjuntoId).subscribe({
          next: () => {
            Swal.fire('Borrada','Imagen eliminada','success');
            this.cargarTodos();
          },
          error: () => Swal.fire('Error','No se pudo borrar','error'),
          complete: () => this.loading = false
        });
      }
    });
  }
  // -------------------
}
