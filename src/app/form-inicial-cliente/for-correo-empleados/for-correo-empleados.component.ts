import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CorreoService } from '../service/correo.service'; // Importar el servicio de correos
import Swal from 'sweetalert2';

@Component({
  selector: 'app-for-correo-empleados',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-correo-empleados.component.html',
  styleUrls: ['./for-correo-empleados.component.css']
})
export class ForCorreoEmpleadosComponent implements OnInit {
  correoForm!: FormGroup;
  informeId!: number;
  correos: any[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private correoService: CorreoService, // Cambiado a servicio de correos
    private router: Router
  ) {}

  ngOnInit(): void {
    this.informeId = +this.route.snapshot.paramMap.get('informeId')!;
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido', 'error');
      return;
    }

    this.correoForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]] // Validación para correos
    });

    this.cargarCorreos();
  }

  cargarCorreos(): void {
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido para cargar correos', 'error');
      return;
    }

    this.isLoading = true;
    this.correoService.getCorreos(this.informeId).subscribe(
      (data: any[]) => {
        this.correos = data;
        this.isLoading = false;
      },
      (error) => {
        Swal.fire('Error', 'No se pudieron cargar los correos.', 'error');
        this.isLoading = false;
      }
    );
  }

  agregarCorreo(): void {
    if (this.correoForm.valid) {
      const nuevoCorreo = { ...this.correoForm.value, informeId: this.informeId }; // Agregar informeId al correo
      this.correoService.createCorreo(nuevoCorreo).subscribe(
        () => {
          Swal.fire('Correo agregado', '', 'success');
          this.cargarCorreos();
          this.correoForm.reset();
        },
        (error) => {
          Swal.fire('Error al agregar correo', error.message, 'error');
        }
      );
    }
  }

  eliminarCorreo(id: number): void {
    this.correoService.deleteCorreo(id).subscribe(
      () => {
        Swal.fire('Correo eliminado', '', 'success');
        this.cargarCorreos();
      },
      (error) => {
        Swal.fire('Error al eliminar correo', error.message, 'error');
      }
    );
  }

  editarCorreo(correo: any): void {
    this.correoForm.patchValue(correo);
  }

  volver(): void {
    this.router.navigate(['/form-informe']);
  }
}
