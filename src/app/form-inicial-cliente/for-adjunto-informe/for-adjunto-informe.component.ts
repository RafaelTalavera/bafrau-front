import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavComponent } from '../../gobal/nav/nav.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AdjuntoInformeService } from '../service/adjunto-informe.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-for-adjunto-informe',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-adjunto-informe.component.html',
  styleUrl: './for-adjunto-informe.component.css'
})
export class ForAdjuntoInformeComponent implements OnInit {

  adjuntoInformeForm: FormGroup; // Cambiado para reflejar correctamente el nombre del formulario
  informeId!: number;
  adjuntoInforme: any[] = [];
  isLoading: boolean = false;
  selectedFile: File | null = null;
  fileTouched: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private adjuntoInformeService: AdjuntoInformeService,
    private router: Router
  ) {
    // Inicializar el formulario
    this.adjuntoInformeForm = this.fb.group({
      descripcion: ['', Validators.required] // Corregido 'descipcion' a 'descripcion'
    });
  }

  ngOnInit(): void {
    const informeIdParam = this.route.snapshot.paramMap.get('informeId');
    if (informeIdParam === null || informeIdParam === undefined) {
      Swal.fire('Error', 'El ID del informe es requerido', 'error');
      return;
    }

    const informeIdNumber = Number(informeIdParam);
    if (isNaN(informeIdNumber) || informeIdNumber <= 0) {
      Swal.fire('Error', 'El ID del informe no es válido', 'error');
      return;
    }

    this.informeId = informeIdNumber;
    this.cargarAdjuntoInforme();
  }

  onFileSelected(event: any): void {
    this.fileTouched = true;
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  cargarAdjuntoInforme(): void {
    if (this.informeId === undefined || this.informeId === null || isNaN(this.informeId)) {
      Swal.fire('Error', 'El ID del informe es requerido para cargar los adjuntos', 'error');
      return;
    }

    this.isLoading = true;
    this.adjuntoInformeService.getAdjuntoInformeByInformeId(this.informeId).subscribe(
      (data: any[]) => {
        this.adjuntoInforme = data;
        this.isLoading = false;
      },
      (error) => {
        Swal.fire('Error al cargar los adjuntos', error.message, 'error');
        this.isLoading = false;
      }
    );
  }

  agregarAdjuntoInforme(): void {
    if (this.adjuntoInformeForm.valid && this.selectedFile) {
      if (this.informeId === undefined || this.informeId === null || isNaN(this.informeId)) {
        Swal.fire('Error', 'El ID del informe es requerido y debe ser válido', 'error');
        return;
      }
  
      const formData = new FormData();
      // Agregar la descripción como un parámetro separado
      formData.append('descripcion', this.adjuntoInformeForm.get('descripcion')!.value); // Cambiar 'descipcion' a 'descripcion'
      formData.append('informeId', String(this.informeId)); // Enviar informeId también como texto
      formData.append('file', this.selectedFile); // Cambiar el nombre del campo a 'file'
  
      this.adjuntoInformeService.createAdjuntoInforme(formData).subscribe(
        () => {
          Swal.fire('Adjunto agregado', '', 'success');
          this.cargarAdjuntoInforme();
          this.adjuntoInformeForm.reset();
          this.selectedFile = null;
          this.fileTouched = false;
        },
        (error) => {
          Swal.fire('Error al agregar adjunto', error.message, 'error');
        }
      );
    } else {
      this.adjuntoInformeForm.markAllAsTouched();
      this.fileTouched = true;
    }
  }
  
  

  eliminarAdjuntoInforme(id: number): void {
    this.adjuntoInformeService.deleteAdjuntoInforme(id).subscribe(
      () => {
        Swal.fire('Adjunto del informe eliminado', '', 'success');
        this.cargarAdjuntoInforme();
      },
      (error) => {
        Swal.fire('Error al eliminar Adjunto del informe', error.message, 'error');
      }
    );
  }

  editarAdjuntoInforme(adjuntoInforme: any): void {
    this.adjuntoInformeForm.patchValue({
      descripcion: adjuntoInforme.descripcion
    });
  }

  volver(): void {
    this.router.navigate(['/form-informe']);
  }

  verAdjunto(adjuntoUrl: string): void {
    window.open(adjuntoUrl, '_blank');
  }
}
