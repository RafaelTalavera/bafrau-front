import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Para manejar rutas
import { InsumoService } from '../service/insumo.service'; // Servicio para manejar Insumos
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-for-insumo',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-insumo.component.html',
  styleUrls: ['./for-insumo.component.css']
})
export class ForInsumoComponent implements OnInit {
  insumoForm: FormGroup;
  procesoId!: number;
  insumos: any[] = [];
  isLoading: boolean = false;
  selectedFile: File | null = null;
  fileTouched: boolean = false; // Indicador para saber si el archivo ha sido tocado

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private insumoService: InsumoService,
    private router: Router
  ) {
    // Inicializar el formulario sin procesoId
    this.insumoForm = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const procesoIdParam = this.route.snapshot.paramMap.get('procesoId');
    if (procesoIdParam === null || procesoIdParam === undefined) {
      Swal.fire('Error', 'El ID del proceso es requerido', 'error');
      return;
    }

    const procesoIdNumber = Number(procesoIdParam);
    if (isNaN(procesoIdNumber) || procesoIdNumber <= 0) {
      Swal.fire('Error', 'El ID del proceso no es válido', 'error');
      return;
    }

    this.procesoId = procesoIdNumber;

    this.cargarInsumos();
  }

  onFileSelected(event: any): void {
    this.fileTouched = true;
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  cargarInsumos(): void {
    if (this.procesoId === undefined || this.procesoId === null || isNaN(this.procesoId)) {
      Swal.fire('Error', 'El ID del proceso es requerido para cargar insumos', 'error');
      return;
    }

    this.isLoading = true;
    this.insumoService.getInsumos(this.procesoId).subscribe(
      (data: any[]) => {
        this.insumos = data;
        this.isLoading = false;
      },
      (error) => {
        Swal.fire('Error al cargar insumos', error.message, 'error');
        this.isLoading = false;
      }
    );
  }

  agregarInsumo(): void {
    if (this.insumoForm.valid && this.selectedFile) {
      if (this.procesoId === undefined || this.procesoId === null || isNaN(this.procesoId)) {
        Swal.fire('Error', 'El ID del proceso es requerido y debe ser válido', 'error');
        return;
      }
  
      const formData = new FormData();
  
      // Crear el objeto insumo con los datos necesarios
      const insumo = {
        nombre: this.insumoForm.get('nombre')!.value,
        procesoId: this.procesoId
      };
  
      // Convertir el objeto insumo a un Blob JSON
      const insumoBlob = new Blob([JSON.stringify(insumo)], { type: 'application/json' });
  
      // Añadir el Blob al FormData con la clave 'insumo'
      formData.append('insumo', insumoBlob);
  
      // Añadir el archivo al FormData con la clave 'fichaTecnica'
      formData.append('fichaTecnica', this.selectedFile);
  
      this.insumoService.createInsumo(formData).subscribe(
        () => {
          Swal.fire('Insumo agregado', '', 'success');
          this.cargarInsumos();
          this.insumoForm.reset();
          this.selectedFile = null;
          this.fileTouched = false;
        },
        (error) => {
          Swal.fire('Error al agregar insumo', error.message, 'error');
        }
      );
    } else {
      // Marcar los campos como tocados para mostrar mensajes de error
      this.insumoForm.markAllAsTouched();
      this.fileTouched = true;
    }
  }
  

  eliminarInsumo(id: number): void {
    this.insumoService.deleteInsumo(id).subscribe(
      () => {
        Swal.fire('Insumo eliminado', '', 'success');
        this.cargarInsumos();
      },
      (error) => {
        Swal.fire('Error al eliminar insumo', error.message, 'error');
      }
    );
  }

  editarInsumo(insumo: any): void {
    this.insumoForm.patchValue({
      nombre: insumo.nombre
      // No es necesario incluir procesoId
    });
  }

  volver(): void {
    this.router.navigate(['/form-informe']);
  }

  verFichaTecnica(fichaTecnicaUrl: string): void {
    window.open(fichaTecnicaUrl, '_blank');
  }
  
}