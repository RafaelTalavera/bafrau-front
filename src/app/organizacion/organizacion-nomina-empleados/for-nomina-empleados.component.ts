import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Importa Router para volver

import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import Swal from 'sweetalert2';
import { OrganizacionNominaEmpleadosService } from '../service/organizacion-nomina-empleados.service';

@Component({
  selector: 'app-for-nomina-empleados',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-nomina-empleados.component.html',
  styleUrls: ['./for-nomina-empleados.component.css']
})
export class ForNominaEmpleadosComponent implements OnInit {
  nominaForm!: FormGroup;
  informeId!: number;
  empleados: any[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private nominaService: OrganizacionNominaEmpleadosService,
    private router: Router // Inyecta el router
  ) {}

  ngOnInit(): void {
    this.informeId = +this.route.snapshot.paramMap.get('informeId')!;
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido', 'error');
      return;
    }

    this.nominaForm = this.fb.group({
      puesto: ['', Validators.required],
      contrato: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      informeId: [this.informeId]
    });
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido para cargar empleados', 'error');
      return;
    }

    this.isLoading = true;
    this.nominaService.getEmpleados(this.informeId).subscribe(
      (data: any[]) => {
        this.empleados = data;
        this.isLoading = false;
      },
      (error) => {
        Swal.fire('Error al cargar empleados', error.message, 'error');
        this.isLoading = false;
      }
    );
  }

  agregarEmpleado(): void {
    if (this.nominaForm.valid) {
      this.nominaService.createEmpleado(this.nominaForm.value).subscribe(
        () => {
          Swal.fire('Empleado agregado', '', 'success');
          this.cargarEmpleados();
          this.nominaForm.reset();
        },
        (error) => {
          Swal.fire('Error al agregar empleado', error.message, 'error');
        }
      );
    }
  }

  eliminarEmpleado(id: number): void {
    this.nominaService.deleteEmpleado(id).subscribe(
      () => {
        Swal.fire('Empleado eliminado', '', 'success');
        this.cargarEmpleados();
      },
      (error) => {
        Swal.fire('Error al eliminar empleado', error.message, 'error');
      }
    );
  }

  editarEmpleado(empleado: any): void {
    this.nominaForm.patchValue(empleado);
  }

  getTotalCantidad(): number {
    return this.empleados.reduce((total, empleado) => total + empleado.cantidad, 0);
  }

  volver(): void {
    this.router.navigate(['/form-informe']); 
  }
}
