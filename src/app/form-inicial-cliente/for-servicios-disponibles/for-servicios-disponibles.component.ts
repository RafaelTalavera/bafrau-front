import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiciosService } from '../service/servicios.service';

@Component({
  selector: 'app-for-servicios-disponibles',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-servicios-disponibles.component.html',
  styleUrl: './for-servicios-disponibles.component.css'
})
export class ForServiciosDisponiblesComponent implements OnInit {
  
  servicioForm!: FormGroup;
  informeId!: number;
  serviciosDisponibles: any[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private servicioService: ServiciosService, // Cambiado a servicio de correos
    private router: Router
  ) {}



  ngOnInit(): void {
    this.informeId = +this.route.snapshot.paramMap.get('informeId')!;
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido', 'error');
      return;
    }
  
    this.servicioForm = this.fb.group({
      servicio: ['', Validators.required],
    });
  
    // Realiza la solicitud para cargar los servicios disponibles
    this.cargarServicioDisponible();
  }
  
  cargarServicioDisponible(): void {
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido para cargar servicios disponibles', 'error');
      return;
    }
  
    this.isLoading = true;
  
    this.servicioService.getServicios(this.informeId).subscribe(
      (data: any[]) => {
        this.serviciosDisponibles = data;
        this.isLoading = false;
      },
      (error) => {
        Swal.fire('Error', 'No se pudieron cargar los servicios disponibles.', 'error');
        this.isLoading = false;
      }
    );
  }
  

  agregarServicioDisponible(): void {
    if (this.servicioForm.valid) {
      const nuevoServicioDisponible = { ...this.servicioForm.value, informeId: this.informeId }; // Agregar informeId al correo
      this.servicioService.createServicio(nuevoServicioDisponible).subscribe(
        () => {
          Swal.fire('Servicio Disponible agregado', '', 'success');
          this.cargarServicioDisponible();
          this.servicioForm.reset();
        },
        (error) => {
          Swal.fire('Error al agregar servicio disponible', error.message, 'error');
        }
      );
    }
  }

  eliminarServicio(id: number): void {
    this.servicioService.deleteServicio(id).subscribe(
      () => {
        Swal.fire('Servicio eliminado', '', 'success');
        this.cargarServicioDisponible();
      },
      (error) => {
        Swal.fire('Error al eliminar servicio disponible', error.message, 'error');
      }
    );
  }
  
  editarServicio(servicio: any): void {
    this.servicioForm.patchValue(servicio);
  }
  


  volver(): void {
    this.router.navigate(['/form-informe']);
  }
}
