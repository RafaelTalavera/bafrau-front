import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TelefonoService } from '../service/telefono.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-for-telefono-empleados',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-telefono-empleados.component.html',
  styleUrls: ['./for-telefono-empleados.component.css'] // Corregido
})
export class ForTelefonoEmpleadosComponent implements OnInit {
  telefonoForm!: FormGroup;
  informeId!: number;
  telefonos: any[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private telefonoService: TelefonoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.informeId = +this.route.snapshot.paramMap.get('informeId')!;
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido', 'error');
      return;
    }

    this.telefonoForm = this.fb.group({
      nombre: ['', Validators.required], // Cambiado a 'nombre'
      telefono: ['', Validators.required] // Cambiado a 'telefono'
    });

    this.cargarTelefono();
  }

  cargarTelefono(): void {
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido para cargar telefono', 'error');
      return;
    }

    this.isLoading = true;
    this.telefonoService.getTelefonos(this.informeId).subscribe(
      (data: any[]) => {
        this.telefonos = data; // Corregido de 'telefono' a 'telefonos'
        this.isLoading = false;
      },
      (error) => {
      
        this.isLoading = false;
      }
    );
  }

  agregarTelefono(): void {
    if (this.telefonoForm.valid) {
      const nuevoTelefono = { ...this.telefonoForm.value, informeId: this.informeId }; // Agregar informeId al teléfono
      this.telefonoService.createTelefono(nuevoTelefono).subscribe(
        () => {
          Swal.fire('Teléfono agregado', '', 'success');
          this.cargarTelefono();
          this.telefonoForm.reset();
        },
        (error) => {
          Swal.fire('Error al agregar telefono', error.message, 'error');
        }
      );
    }
  }

  eliminarTelefono(id: number): void {
    this.telefonoService.deleteTelefono(id).subscribe(
      () => {
        Swal.fire('Teléfono eliminado', '', 'success');
        this.cargarTelefono();
      },
      (error) => {
        Swal.fire('Error al eliminar telefono', error.message, 'error');
      }
    );
  }

  editarTelefono(telefono: any): void {
    this.telefonoForm.patchValue(telefono);
  }

  volver(): void {
    this.router.navigate(['/form-informe']); // Cambia la ruta según tu configuración
  }
}
