import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; 
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { FooterComponent } from '../../../gobal/footer/footer.component';
import { NavComponent } from '../../../gobal/nav/nav.component';
import { Factor } from '../../models/factor';
import { FactorService } from '../services/factores.service';
import { FormFactorComponent } from '../form-factor/form-factor.component';


@Component({
  selector: 'app-factores',
  standalone: true,
  imports: [FormFactorComponent, CommonModule, FormsModule, FooterComponent, NavComponent],
  templateUrl: './factores.component.html',
  styleUrls: ['./factores.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  
})
export class FactoresComponent implements OnInit {
  factores: Factor[] = [];
  showError: boolean = false;
  tipoBusqueda: string = '';
  factoresFiltrados: Factor[] = [];
  factorSelected: Factor = new Factor();

  constructor(private service: FactorService, private router: Router) {}

  ngOnInit(): void {
    this.refreshFactores();
  }

  refreshFactores(): void {
    this.service.findAll().pipe(
      catchError((error) => {
        console.error('Error fetching factores:', error);
        this.showError = true;
        return of([]); // Return an empty array or appropriate default value on error
      })
    ).subscribe(
      (factores) => {
        this.factores = factores;
        this.buscarPorTipo(); // Actualiza la lista filtrada también
      }
    );
  }

  addFactor(factor: Factor) {
    if (factor.id > 0) {
      this.service.updateFactor(factor).subscribe(factorUpdated => {
        Swal.fire({
          icon: 'success',
          title: 'Factor Actualizado',
          text: 'El factor se ha actualizado con éxito',
        });
        this.refreshFactores();
      });
    } else {
      this.service.create(factor).subscribe(factorNew => {
        Swal.fire({
          icon: 'success',
          title: 'Factor Creado',
          text: 'El factor se ha creado con éxito',
        });
        this.refreshFactores();
      });
    }
    this.factorSelected = new Factor();
  }

  onUpdateFactor(factorRow: Factor) {
    this.factorSelected = { ...factorRow };
  }

  onRemoveFactor(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que deseas eliminar factor?',
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
            title: 'Factor Eliminado',
            text: 'El factor se ha eliminado con éxito',
          });
          this.refreshFactores();
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          icon: 'info',
          title: 'Eliminación cancelada',
          text: 'La eliminación del factor ha sido cancelada',
        });
      }
    });
  }

  buscarPorTipo(): void {
    if (this.tipoBusqueda.trim() === '') {
      this.factoresFiltrados = this.factores;
    } else {
      this.factoresFiltrados = this.factores.filter(factor =>
        factor.componente.toLowerCase().includes(this.tipoBusqueda.toLowerCase())
      );
    }
  }

  trackByFn(index: number, item: Factor): number {
    return item.id; // O cualquier campo único en tu objeto Organizador
  }
}
