import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; 
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FormAccionComponent } from './form-accion.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { AccionService } from './services/acciones.service';
import { Accion } from '../../models/accion';




@Component({
  selector: 'app-acciones',
  standalone: true,
  imports: [FormAccionComponent, CommonModule, FormsModule, FooterComponent, NavComponent],
  templateUrl: './acciones.component.html',
  styleUrls: ['./acciones.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  
})
export class AccionesComponent implements OnInit {
  acciones: Accion[] = [];
  showError: boolean = false;
  tipoBusqueda: string = '';
  accionesFiltrados: Accion[] = [];
  accionSelected: Accion = new Accion();

  constructor(private service: AccionService, private router: Router) {}

  ngOnInit(): void {
    this.refreshAcciones();
  }

  refreshAcciones(): void {
    this.service.findAll().pipe(
      catchError((error) => {
        console.error('Error fetching factores:', error);
        this.showError = true;
        return of([]); // Return an empty array or appropriate default value on error
      })
    ).subscribe(
      (acciones) => {
        this.acciones = acciones;
        this.buscarPorTipo(); // Actualiza la lista filtrada también
      }
    );
  }

  addAccion(accion: Accion) {
    if (accion.id > 0) {
      this.service.updateAccion(accion).subscribe(accionUpdated => {
        Swal.fire({
          icon: 'success',
          title: 'Acción Actualizado',
          text: 'La acción se ha actualizado con éxito',
        });
        this.refreshAcciones();
      });
    } else {
      this.service.create(accion).subscribe(accionNew => {
        Swal.fire({
          icon: 'success',
          title: 'Acción Creada',
          text: 'La acción se ha creado con éxito',
        });
        this.refreshAcciones();
      });
    }
    this.accionSelected = new Accion();
  }

  onUpdateAccion(accionRow: Accion) {
    this.accionSelected = { ...accionRow };
  }

  onRemoveAccion(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que deseas eliminar la acción?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.remove(id).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Acción Eliminado',
            text: 'La acción se ha eliminado con éxito',
          });
          this.refreshAcciones();
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          icon: 'info',
          title: 'Eliminación cancelada',
          text: 'La eliminación del la acción ha sido cancelada',
        });
      }
    });
  }

  buscarPorTipo(): void {
    if (this.tipoBusqueda.trim() === '') {
      this.accionesFiltrados = this.acciones;
    } else {
      this.accionesFiltrados = this.acciones.filter(accion =>
        accion.tipo.toLowerCase().includes(this.tipoBusqueda.toLowerCase())
      );
    }
  }

  trackByFn(index: number, item: Accion): number {
    return item.id; // O cualquier campo único en tu objeto Organizador
  }
}
