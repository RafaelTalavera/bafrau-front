// src/app/caratula/caratula.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  FormBuilder, FormGroup, Validators,
  ReactiveFormsModule, FormsModule,
  ValidatorFn, AbstractControl, ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

import { CaratulaService } from '../service/caratula.service';
import { CaratulaDTO } from '../models/caratula-dto';
import { InformeAuditoriaService } from '../service/informe-auditoria.service';
import { AdjuntosService } from '../../utils/adjuntos.service';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';


export type CaratulaView = Omit<CaratulaDTO, 'adjuntos'> & {
  adjuntos?: { id: number; urlAdjunto: string }[];
};

@Component({
  selector: 'app-caratula',
  standalone: true,
  imports: [
    NavComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SpinnerComponent
  ],
  templateUrl: './caratula.component.html',
  styleUrls: ['./caratula.component.css']
})
export class CaratulaComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form: FormGroup;
  caratulas: CaratulaView[] = [];
  currentAdjuntos: { id: number; urlAdjunto: string }[] = [];
  editarId: number | null = null;
  informeId!: number;
  informeTitulo = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private caratulaService: CaratulaService,
    private informeService: InformeAuditoriaService,
    private adjuntosService: AdjuntosService,
   
  
  ) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      elaborador: ['', Validators.required],
      fecha: ['', [Validators.required, this.monthYearValidator()]]
    });
  }

  ngOnInit(): void {
    this.informeId = Number(this.route.snapshot.paramMap.get('informeId'));
    if (!this.informeId) {
      Swal.fire('Error', 'Informe no especificado', 'error');
      this.router.navigate(['/']);
      return;
    }
    this.informeService.getById(this.informeId).subscribe({
      next: inf => this.informeTitulo = inf.titulo,
      error: () => Swal.fire('Error', 'No se pudo cargar el informe', 'error')
    });
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;
    this.caratulaService.getByInforme(this.informeId).subscribe({
      next: list => {
        this.caratulas = list.map(c => ({ ...c, adjuntos: c.adjuntos }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar carátulas', 'error');
      }
    });
  }

  private monthYearValidator(): ValidatorFn {
    const regex = /^(0[1-9]|1[0-2])\-\d{4}$/;
    return (c: AbstractControl): ValidationErrors | null =>
      regex.test(c.value) ? null : { invalidFormat: true };
  }

  editar(c: CaratulaView): void {
    this.editarId = c.id!;
    this.form.patchValue({
      titulo: c.titulo,
      elaborador: c.elaborador,
      fecha: c.fecha
    });
    this.currentAdjuntos = c.adjuntos ?? [];
  }

  cancelar(): void {
    this.editarId = null;
    this.form.reset({ titulo: '', elaborador: '', fecha: '' });
    this.currentAdjuntos = [];
  }

  submit(): void {
    if (this.form.invalid) return;
    const dto: CaratulaDTO = {
      ...this.form.value,
      informeId: this.informeId,
      id: this.editarId ?? undefined,
      adjuntos: [],
      adjuntosIds: []
    } as CaratulaDTO;
    this.loading = true;

    const request$ = this.editarId
      ? this.caratulaService.updateCaratula(this.editarId, dto)
      : this.caratulaService.createCaratula(dto);

    request$.subscribe({
      next: () => {
        Swal.fire('Listo', `Carátula ${this.editarId ? 'actualizada' : 'creada'}`, 'success');
        this.cancelar();
        this.loadAll();
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo guardar carátula', 'error');
      },
      complete: () => this.loading = false
    });
  }

  borrar(id: number): void {
    Swal.fire({
      title: '¿Eliminar esta carátula?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar'
    }).then(res => {
      if (res.isConfirmed) {
        this.loading = true;
        this.caratulaService.deleteCaratula(id).subscribe({
          next: () => {
            Swal.fire('Borrada', 'Carátula eliminada', 'success');
            this.loadAll();
          },
          error: () => {
            this.loading = false;
            Swal.fire('Error', 'No se pudo eliminar la carátula', 'error');
          }
        });
      }
    });
  }

  onFileSelected(event: Event, caratulaId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const car = this.caratulas.find(x => x.id === caratulaId);
    const actuales = car?.adjuntos?.length ?? 0;
    if (actuales >= 2) {
      Swal.fire('Atención', 'Ya tienes dos imágenes.', 'warning');
      input.value = '';
      return;
    }
    this.loading = true;
    this.adjuntosService.uploadAdjuntoCaratula(file, file.name, caratulaId)
      .subscribe({
        next: () => {
          Swal.fire('Listo', 'Imagen cargada', 'success');
          this.loadAll();
          input.value = '';
        },
        error: () => Swal.fire('Error', 'No se pudo subir la imagen', 'error'),
        complete: () => this.loading = false
      });
  }

  openImagenOptions(c: CaratulaView, fileInput: HTMLInputElement): void {
    const actuales = c.adjuntos?.length ?? 0;
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
        this.verAdjuntos(c);
      }
    });
  }

  verAdjuntos(c: CaratulaView): void {
    this.loading = true;
    const html = c.adjuntos!
      .map(a => `
        <div class="d-flex align-items-center mb-2">
          <img src="${a.urlAdjunto}" style="max-height:100px; margin-right:1rem;" />
          <button class="btn btn-danger btn-sm" id="del-${a.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>`)
      .join('');
    Swal.fire({
      title: 'Adjuntos',
      html,
      showCloseButton: true,
      width: '600px',
      didOpen: () => {
        this.loading = false;
        const container = Swal.getHtmlContainer()!;
        c.adjuntos!.forEach(a => {
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
            Swal.fire('Borrada', 'Imagen eliminada', 'success');
            this.loadAll();
          },
          error: () => Swal.fire('Error', 'No se pudo borrar la imagen', 'error'),
          complete: () => this.loading = false
        });
      }
    });
  }


  onPreviewClick(): void {
    this.router.navigate(['/informes', this.informeId, 'preview']);
  }

}
