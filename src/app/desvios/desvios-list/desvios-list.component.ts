import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { DesvioListItem, EstadoDesvio, ESTADO_LABEL, ResumenDesvios } from '../models/desvio.model';
import { DesviosService } from '../services/desvios.service';

@Component({ selector: 'app-desvios-list', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule], templateUrl: './desvios-list.component.html', styleUrls: ['./desvios-list.component.css'] })
export class DesviosListComponent implements OnInit {
  items: DesvioListItem[] = []; organizaciones: any[] = []; resumen?: ResumenDesvios;
  loading = false; error = ''; page = 0; totalPages = 0; readonly labels = ESTADO_LABEL;
  readonly estados: EstadoDesvio[] = ['PRIMERA_OBSERVACION', 'EN_PROCESO', 'PERMANECE', 'FINALIZADO'];
  filtros = this.fb.group({ texto: [''], organizacionId: [''], estado: [''], desde: [''], hasta: [''] });
  constructor(private fb: FormBuilder, private service: DesviosService, private orgService: OrganizacionService) {}
  ngOnInit(): void { this.cargar(); this.service.resumen().subscribe(r => this.resumen = r); this.orgService.getAllOrganizaciones().subscribe(o => this.organizaciones = o.filter(x => x.vigente !== false)); }
  cargar(page = 0): void {
    this.loading = true; this.error = ''; const v = this.filtros.value;
    this.service.listar({ texto: v.texto || undefined, organizacionId: v.organizacionId ? Number(v.organizacionId) : undefined, estado: (v.estado || undefined) as EstadoDesvio | undefined, desde: v.desde || undefined, hasta: v.hasta || undefined, page }).subscribe({
      next: r => { this.items = r.content; this.page = r.number; this.totalPages = r.totalPages; this.loading = false; },
      error: () => { this.error = 'No se pudieron cargar los desvíos.'; this.loading = false; }
    });
  }
  limpiar(): void { this.filtros.reset(); this.cargar(); }
  estadoClass(e: EstadoDesvio): string { return e === 'FINALIZADO' ? 'success' : e === 'PERMANECE' ? 'danger' : e === 'EN_PROCESO' ? 'warning' : 'info'; }
}
