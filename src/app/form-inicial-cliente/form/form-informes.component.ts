import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { InformeService } from '../service/informe-service';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { Informe } from '../../models/informe.model';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { NominaService } from '../service/nomina.service';
import { TelefonoService } from '../service/telefono.service';
import { CorreoService } from '../service/correo.service';
import { ServiciosService } from '../service/servicios.service';
import { InsumoService } from '../service/insumo.service';
import { ProcesoService } from '../service/proceso.service';
import { ProcedimientoService } from '../service/procedimiento.service';
import { AdjuntoInformeService } from '../service/adjunto-informe.service';

@Component({
  selector: 'app-form-informes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FooterComponent, NavComponent],
  templateUrl: './form-informes.component.html',
  styleUrls: ['./form-informe.component.css'],
})
export class FormInformesComponent implements OnInit {
  @ViewChild('formularioInicial') formularioInicial!: ElementRef; //me lleva a ese lugar cuando apreto el boton de editra
  informeForm!: FormGroup;
  informes: Informe[] = [];
  filteredInformes: Informe[] = [];
  searchControl = new FormControl('');
  totalSections = 8;
  informeIdEnEdicion: number | null = null;

  constructor(
    private fb: FormBuilder,
    private informeService: InformeService,
    private router: Router,
    private nominaService: NominaService,
    private telefonoService: TelefonoService,
    private correoService: CorreoService,
    private servicioService: ServiciosService,
    private procesoService: ProcesoService,
    private insumoService: InsumoService,
    private procedimientoService: ProcedimientoService,
    private adjuntoInformeService: AdjuntoInformeService
  ) { }

  ngOnInit(): void {
    this.informeForm = this.fb.group({
      nombreDelProponente: ['', Validators.required],
      razonSocial: ['', Validators.required],
      apoderadoLegal: ['', Validators.required],
      apoderadoCargo: ['', Validators.required],
      cuit: ['', [Validators.required, Validators.maxLength(11), Validators.pattern("^[0-9]*$")]],
      domicilioRealProyecto: ['', Validators.required],
      domicilioLegalProyecto: ['', Validators.required],
      situacionPredio: ['', Validators.required],
      nomenclaturaCatatrasl: ['', Validators.required],
      licenciaComercial: ['', Validators.required],
      personeriaJuridica: ['', Validators.required],
      fechaCreacion: ['', Validators.required],
      actividadPrincipal: ['', Validators.required],
      dimensionPredio: ['', [Validators.required, Validators.pattern("^[0-9]+(.[0-9]+)?$")]],
      superficieCubierta: ['', [Validators.required, Validators.pattern("^[0-9]+(.[0-9]+)?$")]],
      superficieDescubierta: ['', [Validators.required, Validators.pattern("^[0-9]+(.[0-9]+)?$")]],
      tecnologia: ['', Validators.required]
    });

    this.loadInformes();

    this.searchControl.valueChanges.subscribe((searchTerm) => {
      this.filterInformes(searchTerm);
    });

    this.informeForm.statusChanges.subscribe(() => {
      this.debugFormState();
    });
  }

  debugFormState() {
    console.log('Estado del formulario:', this.informeForm.status);
    Object.keys(this.informeForm.controls).forEach((key) => {
      const control = this.informeForm.get(key);
      if (control?.invalid) {
        console.log(`Control inválido: ${key}`, control.errors);
      }
    });
  }

  loadInformes(): void {
    this.informeService.getAllInformes().subscribe({
      next: (data: Informe[]) => {
        this.informes = data;
        // Cargar empleados para cada informe
        this.informes.forEach(informe => {
          if (informe.id) {
            this.nominaService.getEmpleados(informe.id).subscribe(
              (empleados: any[]) => {
                informe.empleados = empleados;
              },
              error => {
                console.error('Error al cargar empleados para el informe', informe.id, error);
              }
            );
          }
        });
        this.filterInformes(this.searchControl.value);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error cargando informes:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los informes.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }
  

  filterInformes(searchTerm: string | null): void {
    const term = searchTerm ? searchTerm.toLowerCase() : '';
    if (term === '') {
      this.filteredInformes = this.informes;
    } else {
      this.filteredInformes = this.informes.filter((informe) => {
        const nombreProponente = (informe.nombreDelProponente || '').toLowerCase();
        return nombreProponente.includes(term);
      });
    }
  }

  onSubmit(): void {
    if (this.informeForm.valid) {
      const informeData: Informe = this.informeForm.value;

      if (this.informeIdEnEdicion) {
        // Modo edición
        this.informeService.updateInforme(this.informeIdEnEdicion, informeData).subscribe(
          (response: Informe) => {
            Swal.fire({
              title: 'Éxito',
              text: 'Informe actualizado correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar',
            });

            // Actualizar el informe en la lista
            const index = this.informes.findIndex(i => i.id === this.informeIdEnEdicion);
            if (index !== -1) {
              this.informes[index] = response;
            }

            this.filterInformes(this.searchControl.value);
            this.resetFormulario();
            this.loadInformes();
          },
          (error) => {
            console.error('Error actualizando informe', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo actualizar el informe.',
              icon: 'error',
              confirmButtonText: 'Aceptar',
            });
          }
        );
      } else {
        // Modo creación
        this.informeService.createInforme(informeData).subscribe(
          (response: Informe) => {
            Swal.fire({
              title: 'Éxito',
              text: 'Informe creado correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar',
            });
            response.empleados = [];
            this.informes.push(response);
            this.filterInformes(this.searchControl.value);
            this.resetFormulario();
            this.loadInformes();
          },
          (error) => {
            console.error('Error creando informe', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo crear el informe.',
              icon: 'error',
              confirmButtonText: 'Aceptar',
            });
          }
        );
      }
    }
  }

  resetFormulario(): void {
    this.informeForm.reset();
    this.informeIdEnEdicion = null;
    this.loadInformes(); 
  }

  editarInforme(informe: Informe): void {
    this.informeForm.patchValue(informe);
    this.informeIdEnEdicion = informe.id ?? null;
    this.informeForm.markAsPristine();
    this.informeForm.markAsUntouched();
    this.scrollToFormulario(); // Lleva directamente al formulario antes de mostrar el mensaje.
  
  }
  
  scrollToFormulario(): void {
    const elementoFormulario = this.formularioInicial.nativeElement;
    elementoFormulario.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  
    const contenedorPrincipal = document.querySelector('.content-wrapper');
    if (contenedorPrincipal) {
      contenedorPrincipal.scrollTo({
        top: elementoFormulario.offsetTop,
        behavior: 'smooth',
      });
    }
  }
  
  

  eliminarInforme(informe: Informe): void {
    if (typeof informe.id === 'number') {
      Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás deshacer esta acción y se perdera toda la información cargada.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.informeService.deleteInforme(informe.id!).subscribe(
            () => {
              Swal.fire({
                title: 'Eliminado',
                text: 'El informe ha sido eliminado con éxito.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
              });
              this.informes = this.informes.filter(i => i.id !== informe.id);
              this.filterInformes(this.searchControl.value);
              this.loadInformes(); 
            },
            (error: any) => {
              console.error('Error al eliminar el informe', error);
              Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar el informe.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
              });
            }
          );
        }
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'El informe no tiene un ID válido.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  }

  // Calcular el porcentaje de secciones completadas y las secciones vacías
calculateCompletionDetails(informe: Informe): { percentage: number, emptySections: string[] } {
  let completedSections = 0;
  const emptySections: string[] = [];

  if (informe.correos && informe.correos.length > 0) {
    completedSections++;
  } else {
    emptySections.push('Correos');
  }

  if (informe.telefonos && informe.telefonos.length > 0) {
    completedSections++;
  } else {
    emptySections.push('Teléfonos');
  }

  if (informe.empleados && informe.empleados.length > 0) {
    completedSections++;
  } else {
    emptySections.push('Empleados');
  }

  if (informe.serviciosDisponibles && informe.serviciosDisponibles.length > 0) {
    completedSections++;
  } else {
    emptySections.push('Servicios Disponibles');
  }

  if (informe.sectores && informe.sectores.length > 0) {
    completedSections++;
  } else {
    emptySections.push('Sectores');
  }

  if (informe.procesos && informe.procesos.length > 0) {
    completedSections++;
  } else {
    emptySections.push('Procesos');
  }

  if (informe.procedimientos && informe.procedimientos.length > 0) {
    completedSections++;
  } else {
    emptySections.push('Procedimientos');
  }

  if (informe.adjuntoInformes && informe.adjuntoInformes.length > 0) {
    completedSections++;
  } else {
    emptySections.push('Adjuntos del Informe');
  }

  const percentage = (completedSections / this.totalSections) * 100;
  return { percentage, emptySections };
}

// Cargar correos
cargarCorreo(informeId: number | undefined): void {
  if (informeId !== undefined) {
    this.router.navigate(['/for-correo', informeId]);
  } else {
    Swal.fire({
      title: 'Error',
      text: 'El informe no tiene un ID válido.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
}

// Cargar teléfonos
cargarTelefono(informeId: number | undefined): void {
  if (informeId !== undefined) {
    this.router.navigate(['/for-telefono', informeId]);
  } else {
    Swal.fire({
      title: 'Error',
      text: 'El informe no tiene un ID válido.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
}

// Obtener el total de empleados
getTotalCantidad(empleados: any[]): number {
  return empleados.reduce((total, empleado) => total + empleado.cantidad, 0);
}

// Cargar nómina de empleados
cargarNominaEmpleados(informeId: number | undefined): void {
  if (informeId !== undefined) {
    this.router.navigate(['/for-nomina-empleados', informeId]);
  } else {
    Swal.fire({
      title: 'Error',
      text: 'El informe no tiene un ID válido.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
}

// Cargar servicios disponibles
cargarServicioDisponible(informeId: number | undefined): void {
  if (informeId !== undefined) {
    this.router.navigate(['/for-servicio', informeId]);
  } else {
    Swal.fire({
      title: 'Error',
      text: 'El informe no tiene un ID válido.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
}

// Cargar sectores
cargarSector(informeId: number | undefined): void {
  if (informeId !== undefined) {
    this.router.navigate(['/for-sector', informeId]);
  } else {
    Swal.fire({
      title: 'Error',
      text: 'El informe no tiene un ID válido.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
}

// Cargar procesos
cargarProceso(informeId: number | undefined): void {
  if (informeId !== undefined) {
    this.router.navigate(['/for-proceso', informeId]);
  } else {
    Swal.fire({
      title: 'Error',
      text: 'El informe no tiene un ID válido.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
}

// Ver adjunto
verAdjunto(adjuntoUrl: string): void {
  window.open(adjuntoUrl, '_blank');
}

// Cargar procedimiento
cargarProcedimiento(informeId: number | undefined): void {
  if (informeId !== undefined) {
    this.router.navigate(['/for-procedimiento', informeId]);
  } else {
    Swal.fire({
      title: 'Error',
      text: 'El informe no tiene un ID válido.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
}

// Cargar adjunto del informe
cargarAdjuntoInforme(informeId: number | undefined): void {
  if (informeId !== undefined) {
    this.router.navigate(['/for-adjunto-informe', informeId]);
  } else {
    Swal.fire({
      title: 'Error',
      text: 'El informe no tiene un ID válido.',
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }
}

}
