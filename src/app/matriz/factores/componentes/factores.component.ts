// src/app/matriz/factores/factores.component.ts
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

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
  showError = false;
  tipoBusqueda = '';
  factoresFiltrados: Factor[] = [];
  factorSelected: Factor = new Factor();

  constructor(
    private service: FactorService,
    private router: Router) {}

  ngOnInit(): void {
    this.refreshFactores();
  }

  refreshFactores(): void {
    this.service.findAll().pipe(
      catchError(error => {
        console.error('Error fetching factores:', error);
        this.showError = true;
        return of<Factor[]>([]);
      })
    ).subscribe(factores => {
      this.factores = factores;
      this.buscarPorTipo();
    });
  }

  addFactor(factor: Factor): void {
    console.log('Recibido en padre:', factor);
    if (factor.id > 0) {
      this.service.updateFactor(factor).subscribe(() => {
        Swal.fire({
          icon: 'success',
          title: 'Factor Actualizado',
          text: 'El factor se ha actualizado con éxito',
        });
        this.refreshFactores();
        this.factorSelected = new Factor();
      });
    } else {
      this.service.create(factor).subscribe(() => {
        Swal.fire({
          icon: 'success',
          title: 'Factor Creado',
          text: 'El factor se ha creado con éxito',
        });
        this.refreshFactores();
        this.factorSelected = new Factor();
      });
    }
  }

  onUpdateFactor(factorRow: Factor): void {
    this.factorSelected = { ...factorRow };
  }

  onRemoveFactor(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar este factor?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) {
        this.service.remove(id).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Factor Eliminado',
            text: 'El factor se ha eliminado con éxito',
          });
          this.refreshFactores();
        });
      }
    });
  }

  buscarPorTipo(): void {
    if (this.tipoBusqueda.trim() === '') {
      this.factoresFiltrados = this.factores;
    } else {
      this.factoresFiltrados = this.factores.filter(f =>
        f.componente.toLowerCase().includes(this.tipoBusqueda.toLowerCase())
      );
    }
  }

  trackByFn(index: number, item: Factor): number {
    return item.id;
  }
}
