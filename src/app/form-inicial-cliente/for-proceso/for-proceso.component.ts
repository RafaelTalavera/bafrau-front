import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Para manejar rutas
import { ProcesoService } from '../service/proceso.service'; // Servicio para manejar Procesos
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-for-proceso',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-proceso.component.html',
  styleUrls: ['./for-proceso.component.css']
})
export class ForProcesoComponent implements OnInit {
  procesoForm!: FormGroup;
  informeId!: number;
  procesos: any[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private procesoService: ProcesoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.informeId = +this.route.snapshot.paramMap.get('informeId')!;
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido', 'error');
      return;
    }

    this.procesoForm = this.fb.group({
      nombre: ['', Validators.required],
      producto: ['', Validators.required],
      subProducto: ['', Validators.required],
      acopioResiduos: ['', Validators.required],
      sitioResiduos: ['', Validators.required],
      recipienteResiduos: ['', Validators.required],
      residuosLiquidos: ['', Validators.required],
      residuos: this.fb.array([], Validators.required),   // FormArray para residuos
      informeId: [this.informeId]
    });

    this.cargarProcesos();
  }

  // Getter para residuos como FormArray
  get residuos(): FormArray {
    return this.procesoForm.get('residuos') as FormArray;
  }

  // Añadir un nuevo residuo al array
  agregarResiduo(): void {
    this.residuos.push(this.fb.control('', Validators.required)); // Asegurarse de que el control esté bien inicializado
  }

  // Eliminar un residuo del array
  eliminarResiduo(index: number): void {
    this.residuos.removeAt(index);
  }

  cargarProcesos(): void {
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido para cargar procesos', 'error');
      return;
    }

    this.isLoading = true;
    this.procesoService.getProcesos(this.informeId).subscribe(
      (data: any[]) => {
        this.procesos = data;
        this.isLoading = false;
      },
      (error) => {
        Swal.fire('Error al cargar procesos', error.message, 'error');
        this.isLoading = false;
      }
    );
  }

  agregarProceso(): void {
    if (this.procesoForm.valid) {
      const proceso = { ...this.procesoForm.value, informeId: this.informeId };
  
      console.log('Datos enviados:', JSON.stringify(proceso, null, 2));
  
      this.procesoService.createProceso(proceso).subscribe(
        () => {
          Swal.fire('Proceso agregado', '', 'success');
          this.cargarProcesos();
          this.procesoForm.reset();
          this.residuos.clear();  // Esto limpia el FormArray
        },
        (error) => {
          Swal.fire('Error al agregar proceso', error.message, 'error');
        }
      );
    } else {
      // Marcar todos los campos como tocados para mostrar los mensajes de error
      this.procesoForm.markAllAsTouched();
    }
  }
  

  eliminarProceso(id: number): void {
    this.procesoService.deleteProceso(id).subscribe(
      () => {
        Swal.fire('Proceso eliminado', '', 'success');
        this.cargarProcesos();
      },
      (error) => {
        Swal.fire('Error al eliminar proceso', error.message, 'error');
      }
    );
  }

  editarProceso(proceso: any): void {
    this.procesoForm.patchValue(proceso);
    this.residuos.clear();
    proceso.residuos.forEach((residuo: string) => {
      this.residuos.push(this.fb.control(residuo)); // Asegurarse de que el valor del residuo se cargue correctamente
    });
  }

  volver(): void {
    this.router.navigate(['/form-informe']); 
  }

  irAInsumos(procesoId: number): void {
    this.router.navigate(['/for-insumo', procesoId]);
  }
}