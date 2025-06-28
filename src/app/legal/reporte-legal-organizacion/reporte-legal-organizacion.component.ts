import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';
import { ControlService } from '../service/control.service';
import { OrganizacionDTO, ItemControlDTO } from '../models/control.model';

@Component({
  selector: 'app-reporte-legal-organizacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NavComponent,
    FooterComponent,
    SpinnerComponent
  ],
  templateUrl: './reporte-legal-organizacion.component.html',
  styleUrls: ['./reporte-legal-organizacion.component.css']
})
export class ReporteLegalOrganizacionComponent implements OnInit {
  organizaciones: OrganizacionDTO[] = [];
  items: ItemControlDTO[] = [];
  loading = false;
  itemsLoading = false;
  filtroRazon: string = '';

  // Flags para controlar la vista
  showOrgList = true;
  showItems = false;

  constructor(private controlService: ControlService) {}

  ngOnInit(): void {
    this.loading = true;
    this.controlService.getOrganizaciones().subscribe({
      next: orgs => {
        this.organizaciones = orgs;
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar organizaciones', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las organizaciones', 'error');
      }
    });
  }

  get filteredOrganizaciones(): OrganizacionDTO[] {
    const term = this.filtroRazon.trim().toLowerCase();
    if (!term) return this.organizaciones;
    return this.organizaciones.filter(o =>
      o.razonSocial.toLowerCase().includes(term)
    );
  }


verReporte(orgId: number): void {
  // ocultar listado y preparar tabla
  this.showOrgList = false;
  this.showItems = false;

  this.itemsLoading = true;
  this.items = [];

  this.controlService.getItemsPorOrganizacion(orgId).subscribe({
    next: items => {
      this.items = items;
      this.itemsLoading = false;
      this.showItems = true;
    },
    error: err => {
      console.error(`Error al cargar items para org ${orgId}`, err);
      this.itemsLoading = false;
      Swal.fire('Error', 'No se pudieron cargar los ítems', 'error');
    }
  });
}

  volverListado() {
    this.showOrgList = true;
    this.showItems = false;
  }

}