import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // <-- Importamos Router
import Swal from 'sweetalert2';

import { NavComponent } from '../gobal/nav/nav.component';
import { FooterComponent } from '../gobal/footer/footer.component';

import { InformeDTO } from './models/informe-dto.models';
import { InformeAuditoriaService } from './service/informe-auditoria.service';
import { OrganizacionService } from '../organizacion/service/organizacion-service';
import { SpinnerComponent } from '../utils/spinner/spinner.component';

@Component({
  selector: 'app-informe-auditoria',
  standalone: true,
  imports: [NavComponent, FooterComponent, CommonModule, ReactiveFormsModule, FormsModule, SpinnerComponent],
  templateUrl: './informe-auditoria.component.html',
  styleUrls: ['./informe-auditoria.component.css']
})
export class InformeAuditoriaComponent implements OnInit {
  informeForm: FormGroup;
  informes: InformeDTO[] = [];
  organizaciones: { id: number; razonSocial: string }[] = [];
  informe: InformeDTO = { id: 0, titulo: '', fecha: '', organizacionId: 0, razonSocial: '' };
  editarId: number | null = null;
  organizationFilter = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private service: InformeAuditoriaService,
    private organizacionService: OrganizacionService,
    private router: Router
  ) {
    this.informeForm = this.fb.group({
      titulo: ['', Validators.required],
      fecha: ['', Validators.required],
      organizacionId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.obtenerOrganizaciones();
    this.cargarInformes();
  }




  obtenerOrganizaciones(): void {
    this.organizacionService.getOrganizacionesAuditoriaAmbiental().subscribe(
      o => {
        this.organizaciones = (o || []).map(org => ({
          id: org.id!,
          razonSocial: org.razonSocial
        }));
      },
      err => {
        Swal.fire('Error', 'No se pudo cargar la lista de organizaciones', 'error');
      }
    );
  }

  setRazonSocial(id: number): void {
    this.informe.organizacionId = id;
    const o = this.organizaciones.find(x => x.id === id);
    this.informe.razonSocial = o?.razonSocial || '';
    this.informeForm.get('organizacionId')?.setValue(id);
  }

  cargarInformes(): void {
    this.loading = true;  // ← muestra el spinner
    this.service.getAll().subscribe({
      next: (data) => {
        this.informes = (data || []).sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        this.loading = false;  // ← oculta el spinner
      },
      error: (err) => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Error', 'No se pudieron cargar los informes', 'error');
      }
    });
  }


  onSubmit(): void {
    if (this.informeForm.invalid || !this.informe.organizacionId) return;

    const dto: InformeDTO = {
      ...this.informeForm.value,
      organizacionId: this.informe.organizacionId,
      razonSocial: this.informe.razonSocial
    };

    if (this.editarId == null) {
      this.service.create(dto).subscribe({
        next: (res) => {
          this.informes.push(res);
          this.informeForm.reset();
          this.informe = { id: 0, titulo: '', fecha: '', organizacionId: 0, razonSocial: '' };
          Swal.fire('Éxito', 'Informe creado correctamente', 'success');
        },
        error: (err) => {
          console.error('Error al crear informe:', err);
          Swal.fire('Error', 'No se pudo crear el informe', 'error');
        }
      });
    } else {
      this.service.update(this.editarId, dto).subscribe({
        next: (res) => {
          const idx = this.informes.findIndex(i => i.id === this.editarId);
          if (idx >= 0) this.informes[idx] = res;
          this.informeForm.reset();
          this.informe = { id: 0, titulo: '', fecha: '', organizacionId: 0, razonSocial: '' };
          this.editarId = null;
          Swal.fire('Éxito', 'Informe actualizado correctamente', 'success');
        },
        error: (err) => {
          console.error('Error al actualizar informe:', err);
          Swal.fire('Error', 'No se pudo actualizar el informe', 'error');
        }
      });
    }
  }

  editarInforme(inf: InformeDTO): void {
    this.editarId = inf.id ?? null;
    this.informe = { ...inf };
    this.informeForm.get('titulo')?.setValue(inf.titulo);
    this.informeForm.get('organizacionId')?.setValue(inf.organizacionId);
    this.informeForm.get('fecha')?.setValue(inf.fecha);
  }

  eliminarInforme(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el informe de forma irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(id).subscribe({
          next: () => {
            this.informes = this.informes.filter(i => i.id !== id);
            Swal.fire('Éxito', 'Informe eliminado correctamente', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar informe:', err);
            Swal.fire('Error', 'No se pudo eliminar el informe', 'error');
          }
        });
      }
    });
  }

  cancelarEdicion(): void {
    this.editarId = null;
    this.informeForm.reset();
    this.informe = { id: 0, titulo: '', fecha: '', organizacionId: 0, razonSocial: '' };
  }

  //botón crear capitulo
  crearCapitulos(inf: InformeDTO): void {
    this.router.navigate(['/capitulos', inf.id]);
  }

  //botón crear encabezado
  crearEncabezado(inf: InformeDTO): void {
    this.router.navigate(['/encabezado', inf.id]);
  }

  get filteredInformes(): InformeDTO[] {
    if (!this.organizationFilter) {
      return this.informes;
    }
    const filtro = this.organizationFilter.trim().toLowerCase();
    return this.informes.filter(inf =>
      inf.razonSocial?.toLowerCase().includes(filtro)
    );
  }
}
