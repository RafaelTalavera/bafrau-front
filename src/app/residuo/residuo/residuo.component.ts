import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';
import { Residuo } from '../models/residuo';
import { ResiduoService } from '../service/residuo.service';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { FormResiduoComponent } from "../form-residuo/form-residuo.component";

@Component({
  selector: 'app-residuo',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent, NavComponent, FormResiduoComponent], 
  templateUrl: './residuo.component.html',
  styleUrl: './residuo.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], 
})

export class ResiduoComponent implements OnInit {

  residuos: Residuo[] = [];
  residuosFiltrados: Residuo[] = []; 
  showError = false;
  tipoBusqueda = '';
  residuoSelected: Residuo = new Residuo();

  constructor(
    private service: ResiduoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshResiduos();
  }

  refreshResiduos(): void {
    this.service.findAll().pipe(
      catchError(error => {
        this.showError = true;
        return of([]);
      })
    ).subscribe(data => {
      this.residuos = data;
      this.buscarPorTipo();
    });
  }

  addResiduo(residuo: Residuo): void {
    if (residuo.id > 0) {
      this.service.updateResiduo(residuo).subscribe(() => {
        Swal.fire('Residuo Actualizado', 'El residuo se ha actualizado con éxito', 'success');
        this.refreshResiduos();
        this.residuoSelected = new Residuo(); 
      });
    } else {
      this.service.create(residuo).subscribe(() => {
        Swal.fire('Residuo Creado', 'El residuo se ha creado con éxito', 'success');
        this.refreshResiduos();
        this.residuoSelected = new Residuo();
      });
    }
  }

  onUpdateResiduo(residuoRow: Residuo): void {
    this.residuoSelected = { ...residuoRow };
  }

  onRemoveResiduo(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar este residuo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) {
        this.service.remove(id).subscribe(() => {
          Swal.fire('Residuo Eliminado', 'El residuo se ha eliminado con éxito', 'success');
          this.refreshResiduos();
        });
      }
    });
  }

  buscarPorTipo(): void {
    if (this.tipoBusqueda.trim() === '') {
      this.residuosFiltrados = this.residuos;
    } else {
      this.residuosFiltrados = this.residuos.filter(f =>
        f.corriente?.toLowerCase().includes(this.tipoBusqueda.toLowerCase()) 
      );
    }
  }

  trackByFn(index: number, item: Residuo): number {
    return item.id;
  }
}

