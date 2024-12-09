import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Importa Router para volver
import { SectorService } from '../service/sector.service';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-for-sector',
  standalone: true,
  imports: [CommonModule, FooterComponent, NavComponent, ReactiveFormsModule],
  templateUrl: './for-sector.component.html',
  styleUrls: ['./for-sector.component.css']
})
export class ForSectorComponent implements OnInit {
  sectorForm!: FormGroup;
  informeId!: number;
  sectores: any[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private sectorService: SectorService,
    private router: Router // Inyecta el router
  ) {}

  ngOnInit(): void {
    this.informeId = +this.route.snapshot.paramMap.get('informeId')!;
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido', 'error');
      return;
    }

    this.sectorForm = this.fb.group({
      sector: ['', Validators.required],
      m2: ['', [Validators.required, Validators.min(1)]],
      informeId: [this.informeId]
    });

    this.cargarSectores();
  }

  cargarSectores(): void {
    if (!this.informeId) {
      Swal.fire('Error', 'El ID del informe es requerido para cargar sectores', 'error');
      return;
    }

    this.isLoading = true;
    this.sectorService.getSectores(this.informeId).subscribe(
      (data: any[]) => {
        this.sectores = data;
        this.isLoading = false;
      },
      (error) => {
        Swal.fire('Error al cargar sectores', error.message, 'error');
        this.isLoading = false;
      }
    );
  }

  agregarSector(): void {
    if (this.sectorForm.valid) {
      console.log(this.sectorForm.value); // Verifica si el informeId está presente
      this.sectorService.createSector(this.sectorForm.value).subscribe(
        () => {
          Swal.fire('Sector agregado', '', 'success');
          this.cargarSectores();
          this.sectorForm.reset();
          // Vuelve a asignar el informeId después de resetear el formulario
          this.sectorForm.patchValue({ informeId: this.informeId });
        },
        (error) => {
          Swal.fire('Error al agregar sector', error.message, 'error');
        }
      );
    }
  }
  
  

  eliminarSector(id: number): void {
    this.sectorService.deleteSector(id).subscribe(
      () => {
        Swal.fire('Sector eliminado', '', 'success');
        this.cargarSectores();
      },
      (error) => {
        Swal.fire('Error al eliminar sector', error.message, 'error');
      }
    );
  }

  editarSector(sector: any): void {
    this.sectorForm.patchValue(sector);
  }

  // Método para volver a la página de informes
  volver(): void {
    this.router.navigate(['/form-informe']); // Cambia la ruta según tu configuración
  }
}
