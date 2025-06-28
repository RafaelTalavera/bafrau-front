import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import Swal from 'sweetalert2';
import { OrganizacionService } from '../service/organizacion-service';
import { Organizacion } from '../models/organizacion.model';
import { SpinnerComponent } from "../../utils/spinner/spinner.component";

@Component({
  selector: 'app-organizacion-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NavComponent,
    FooterComponent,
    SpinnerComponent
  ],
  templateUrl: './organizacion-form.component.html',
  styleUrls: ['./organizacion-form.component.css']
})
export class OrganizacionFormComponent implements OnInit {
  @ViewChild('formularioInicial') formularioInicial!: ElementRef;
  organizacionForm!: FormGroup;
  organizacion: Organizacion[] = [];
  organizacionIdEnEdicion: number | null = null;
  filtroRazon: string = '';
  loading = false;

  rrppOptions = ['Generador', 'Operador', 'Transportista'];

  constructor(
    private fb: FormBuilder,
    private organizacionService: OrganizacionService
  ) { }

  ngOnInit(): void {
    this.organizacionForm = this.fb.group({
      fechaAlta: ['', Validators.required],
      tipoDeContrato: ['', Validators.required],
      nombreDelProponente: ['', Validators.required],
      razonSocial: ['', Validators.required],
      cuit: ['', [Validators.required, Validators.maxLength(11), Validators.pattern('^[0-9]*$')]],
      domicilioRealProyecto: ['', Validators.required],
      domicilioLegalProyecto: ['', Validators.required],
      rrpp: [[]]  
    });
    this.loadOrganizaciones();
  }

  get filteredOrganizaciones(): Organizacion[] {
    const term = this.filtroRazon.trim().toLowerCase();
    if (!term) return this.organizacion;
    return this.organizacion.filter(o =>
      o.razonSocial?.toLowerCase().includes(term)
    );
  }

  loadOrganizaciones(): void {
    this.loading = true;  
    this.organizacionService.getAllOrganizaciones().subscribe({
      next: data => {
        this.organizacion = data;
        this.loading = false;  
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las organizaciones.', 'error');
        this.loading = false;  
      }
    });
    
  }

  onRrppChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const list: string[] = this.organizacionForm.get('rrpp')!.value;
    if (checkbox.checked) {
      list.push(checkbox.value);
    } else {
      const idx = list.indexOf(checkbox.value);
      if (idx > -1) list.splice(idx, 1);
    }
    this.organizacionForm.get('rrpp')!.setValue(list);
  }

onSubmit(): void {
  if (this.organizacionForm.invalid) return;

  const datos = this.organizacionForm.value as Organizacion & { rrpp: string[] };
  this.loading = true;  // ← muestra el spinner

  if (this.organizacionIdEnEdicion) {
    this.organizacionService.updateOrganizacion(this.organizacionIdEnEdicion, datos).subscribe({
      next: resp => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Éxito', 'Organización actualizada.', 'success');
        const idx = this.organizacion.findIndex(o => o.id === this.organizacionIdEnEdicion);
        if (idx !== -1) this.organizacion[idx] = resp;
        this.resetFormulario();
      },
      error: () => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Error', 'No se pudo actualizar.', 'error');
      }
    });
  } else {
    this.organizacionService.createOrganizacion(datos).subscribe({
      next: resp => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Éxito', 'Organización creada.', 'success');
        this.organizacion.push(resp);
        this.resetFormulario();
      },
      error: () => {
        this.loading = false;  // ← oculta el spinner
        Swal.fire('Error', 'No se pudo crear.', 'error');
      }
    });
  }
}

  editarInforme(org: Organizacion): void {
    this.organizacionForm.patchValue(org);
    this.organizacionIdEnEdicion = org.id ?? null;
    this.scrollToFormulario();
  }

eliminarInforme(org: Organizacion): void {
  if (!org.id) {
    Swal.fire('Error', 'ID inválido.', 'error');
    return;
  }
  Swal.fire({
    title: '¿Seguro?',
    text: 'Esta acción es irreversible.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(res => {
    if (res.isConfirmed) {
      this.loading = true;  // ← muestra el spinner
      this.organizacionService.deleteOrganizacion(org.id!).subscribe({
        next: () => {
          this.loading = false;  // ← oculta el spinner
          Swal.fire('Eliminado', 'Organización eliminada.', 'success');
          this.organizacion = this.organizacion.filter(o => o.id !== org.id);
        },
        error: () => {
          this.loading = false;  // ← oculta el spinner
          Swal.fire('Error', 'No se pudo eliminar.', 'error');
        }
      });
    }
  });
}


  resetFormulario(): void {
    this.organizacionForm.reset();
    this.organizacionIdEnEdicion = null;
  }

  scrollToFormulario(): void {
    this.formularioInicial.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
