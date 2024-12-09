import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcedimientoService } from '../service/procedimiento.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-for-procedimiento',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-procedimiento.component.html',
  styleUrls: ['./for-procedimiento.component.css']
})
export class ForProcedimientoComponent implements OnInit {
  procedimientoForm: FormGroup;
  informeId!: number;
  procedimientos: any[] = [];
  isLoading: boolean = false;
  selectedFile: File | null = null;
  fileTouched: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private procedimientoService: ProcedimientoService,
    private router: Router
  ) {
    // Inicializar el formulario
    this.procedimientoForm = this.fb.group({
      nombre: ['', Validators.required]
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
    this.cargarProcedimientos();
  }

  onFileSelected(event: any): void {
    this.fileTouched = true;
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  cargarProcedimientos(): void {
    if (this.informeId === undefined || this.informeId === null || isNaN(this.informeId)) {
      Swal.fire('Error', 'El ID del informe es requerido para cargar procedimientos', 'error');
      return;
    }

    this.isLoading = true;
    this.procedimientoService.getProcedimientosByInformeId(this.informeId).subscribe(
      (data: any[]) => {
        this.procedimientos = data;
        this.isLoading = false;
      },
      (error) => {
        Swal.fire('Error al cargar procedimientos', error.message, 'error');
        this.isLoading = false;
      }
    );
  }

  agregarProcedimiento(): void {
    if (this.procedimientoForm.valid && this.selectedFile) {
      if (this.informeId === undefined || this.informeId === null || isNaN(this.informeId)) {
        Swal.fire('Error', 'El ID del informe es requerido y debe ser válido', 'error');
        return;
      }

      const formData = new FormData();
      const procedimiento = {
        nombre: this.procedimientoForm.get('nombre')!.value,
        informeId: this.informeId
      };

      const procedimientoBlob = new Blob([JSON.stringify(procedimiento)], { type: 'application/json' });
      formData.append('procedimiento', procedimientoBlob);
      formData.append('adjunto', this.selectedFile);

      this.procedimientoService.createProcedimiento(formData).subscribe(
        () => {
          Swal.fire('Procedimiento agregado', '', 'success');
          this.cargarProcedimientos();
          this.procedimientoForm.reset();
          this.selectedFile = null;
          this.fileTouched = false;
        },
        (error) => {
          Swal.fire('Error al agregar procedimiento', error.message, 'error');
        }
      );
    } else {
      this.procedimientoForm.markAllAsTouched();
      this.fileTouched = true;
    }
  }

  eliminarProcedimiento(id: number): void {
    this.procedimientoService.deleteProcedimiento(id).subscribe(
      () => {
        Swal.fire('Procedimiento eliminado', '', 'success');
        this.cargarProcedimientos();
      },
      (error) => {
        Swal.fire('Error al eliminar procedimiento', error.message, 'error');
      }
    );
  }

  editarProcedimiento(procedimiento: any): void {
    this.procedimientoForm.patchValue({
      nombre: procedimiento.nombre
    });
  }

  volver(): void {
    this.router.navigate(['/form-informe']);
  }

  verAdjunto(adjuntoUrl: string): void {
    window.open(adjuntoUrl, '_blank');
  }
}
