import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Organizacion } from '../../organizacion/models/organizacion.model';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { CondicionOperacionDesvio, CONDICION_OPERACION_LABEL, DesvioListItem, EstadoDesvio, ESTADO_LABEL, IndiceGravedadDesvio, INDICE_GRAVEDAD_LABEL, porcentajeParaEstado } from '../models/desvio.model';
import { DesviosService } from '../services/desvios.service';

type ClienteConContador = Organizacion & { cantidadDesvios?: number };

@Component({ selector: 'app-desvios-list', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule], templateUrl: './desvios-list.component.html', styleUrls: ['./desvios-list.component.css'] })
export class DesviosListComponent implements OnInit {
  items: DesvioListItem[] = []; clientes: ClienteConContador[] = []; clientesVisibles: ClienteConContador[] = []; clienteSeleccionado?: ClienteConContador;
  busquedaCliente = ''; loading = false; loadingClientes = false; error = ''; page = 0; totalPages = 0; private cargaActual = 0; readonly labels = ESTADO_LABEL;
  readonly gravedadLabels = INDICE_GRAVEDAD_LABEL; readonly condicionLabels = CONDICION_OPERACION_LABEL;
  readonly estados: EstadoDesvio[] = ['PRIMERA_OBSERVACION', 'EN_PROCESO', 'PERMANECE', 'FINALIZADO'];
  readonly anios = Array.from({ length: 11 }, (_, index) => String(new Date().getFullYear() - index));
  readonly meses = [
    { valor: '01', nombre: 'Enero' }, { valor: '02', nombre: 'Febrero' }, { valor: '03', nombre: 'Marzo' },
    { valor: '04', nombre: 'Abril' }, { valor: '05', nombre: 'Mayo' }, { valor: '06', nombre: 'Junio' },
    { valor: '07', nombre: 'Julio' }, { valor: '08', nombre: 'Agosto' }, { valor: '09', nombre: 'Septiembre' },
    { valor: '10', nombre: 'Octubre' }, { valor: '11', nombre: 'Noviembre' }, { valor: '12', nombre: 'Diciembre' }
  ];
  filtros = this.fb.group({ texto: [''], estado: [''], anio: [''], mes: [''] });
  constructor(private fb: FormBuilder, private service: DesviosService, private orgService: OrganizacionService) {}

  ngOnInit(): void {
    this.loadingClientes = true;
    this.orgService.getAllOrganizaciones().subscribe({
      next: organizaciones => {
        this.clientes = organizaciones.filter(o => o.vigente !== false && o.id !== undefined).sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));
        this.loadingClientes = false;
      },
      error: () => { this.error = 'No se pudieron cargar los clientes.'; this.loadingClientes = false; }
    });
  }

  buscarClientes(): void {
    const termino = this.busquedaCliente.trim().toLocaleLowerCase();
    this.clientesVisibles = termino ? this.clientes.filter(c => c.razonSocial.toLocaleLowerCase().includes(termino)).slice(0, 12) : [];
    this.clientesVisibles.forEach(cliente => this.cargarContador(cliente));
  }

  seleccionarCliente(cliente: ClienteConContador): void {
    this.clienteSeleccionado = cliente; this.busquedaCliente = cliente.razonSocial; this.clientesVisibles = [];
    this.cargarContador(cliente); this.cargar();
  }

  cargar(page = 0): void {
    if (!this.clienteSeleccionado?.id) return;
    const carga = ++this.cargaActual;
    this.loading = true; this.error = ''; const v = this.filtros.value; const periodo = this.obtenerPeriodo(v.anio, v.mes);
    this.service.listar({
      texto: v.texto || undefined,
      organizacionId: this.clienteSeleccionado.id,
      estado: (v.estado || undefined) as EstadoDesvio | undefined,
      desde: periodo.desde,
      hasta: periodo.hasta,
      page,
      size: 20
    }).subscribe({
      next: respuesta => {
        if (carga !== this.cargaActual) return;
        this.items = respuesta.content;
        this.page = respuesta.number;
        this.totalPages = respuesta.totalPages;
        this.loading = false;
      },
      error: () => { if (carga === this.cargaActual) { this.error = 'No se pudieron cargar los desvíos del cliente.'; this.loading = false; } }
    });
  }

  limpiarFiltros(): void { this.filtros.reset(); this.cargar(); }
  alCambiarAnio(evento: Event): void {
    const anio = (evento.target as HTMLSelectElement).value;
    this.filtros.controls.anio.setValue(anio);
    if (!anio) this.filtros.controls.mes.reset();
    this.cargar();
  }
  alCambiarMes(evento: Event): void { this.filtros.controls.mes.setValue((evento.target as HTMLSelectElement).value); this.cargar(); }
  quitarCliente(): void { ++this.cargaActual; this.clienteSeleccionado = undefined; this.busquedaCliente = ''; this.clientesVisibles = []; this.items = []; this.page = 0; this.totalPages = 0; this.error = ''; this.filtros.reset(); }
  estadoClass(estado: EstadoDesvio): string { return estado === 'FINALIZADO' ? 'success' : estado === 'PERMANECE' ? 'danger' : estado === 'EN_PROCESO' ? 'warning' : 'info'; }
  porcentaje(estado: EstadoDesvio): number { return porcentajeParaEstado(estado); }
  gravedad(indice?: IndiceGravedadDesvio): string { return indice ? this.gravedadLabels[indice] : 'Sin clasificar'; }
  condicion(condicion?: CondicionOperacionDesvio): string { return condicion ? this.condicionLabels[condicion] : 'Sin clasificar'; }

  private cargarContador(cliente: ClienteConContador): void {
    if (!cliente.id || cliente.cantidadDesvios !== undefined) return;
    this.service.listar({ organizacionId: cliente.id, page: 0, size: 1 }).subscribe({ next: r => cliente.cantidadDesvios = r.totalElements, error: () => cliente.cantidadDesvios = 0 });
  }

  private obtenerPeriodo(anio: string | null | undefined, mes: string | null | undefined): { desde?: string; hasta?: string } {
    if (!anio) return {};
    if (!mes) return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` };
    const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();
    return { desde: `${anio}-${mes}-01`, hasta: `${anio}-${mes}-${String(ultimoDia).padStart(2, '0')}` };
  }

}
