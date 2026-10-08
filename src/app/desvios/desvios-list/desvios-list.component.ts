import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Organizacion } from '../../organizacion/models/organizacion.model';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { CondicionOperacionDesvio, CONDICION_OPERACION_LABEL, DesvioListItem, EstadoDesvio, ESTADO_LABEL, IndiceGravedadDesvio, INDICE_GRAVEDAD_LABEL, porcentajeParaEstado } from '../models/desvio.model';
import { DesviosService } from '../services/desvios.service';
import { Chart, DoughnutController, ArcElement, Legend, Tooltip } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

type ClienteConContador = Organizacion & { cantidadDesvios?: number };

@Component({ selector: 'app-desvios-list', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule], templateUrl: './desvios-list.component.html', styleUrls: ['./desvios-list.component.css'] })
export class DesviosListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gravedadChart') gravedadChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('avanceChart') avanceChartCanvas?: ElementRef<HTMLCanvasElement>;
  private gravedadChart?: Chart<'doughnut'>;
  private avanceChart?: Chart<'doughnut'>;
  private viewReady = false;
  private todosLosItems: DesvioListItem[] = [];
  filtroGraficoGravedad?: IndiceGravedadDesvio | 'SIN_CLASIFICAR';
  filtroGraficoEstado?: EstadoDesvio;
  clientes: ClienteConContador[] = []; clientesVisibles: ClienteConContador[] = []; clienteSeleccionado?: ClienteConContador;
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
  ngAfterViewInit(): void { this.viewReady = true; this.renderizarGraficos(); }
  ngOnDestroy(): void { this.gravedadChart?.destroy(); this.avanceChart?.destroy(); }

  get items(): DesvioListItem[] { return this.filtrarPorGraficos().slice(this.page * 20, this.page * 20 + 20); }

  get hayFiltroGrafico(): boolean { return !!this.filtroGraficoGravedad || !!this.filtroGraficoEstado; }

  buscarClientes(): void {
    const termino = this.busquedaCliente.trim().toLocaleLowerCase();
    this.clientesVisibles = termino ? this.clientes.filter(c => c.razonSocial.toLocaleLowerCase().includes(termino)).slice(0, 12) : [];
    this.clientesVisibles.forEach(cliente => this.cargarContador(cliente));
  }

  seleccionarCliente(cliente: ClienteConContador): void {
    this.clienteSeleccionado = cliente; this.busquedaCliente = cliente.razonSocial; this.clientesVisibles = [];
    this.limpiarFiltrosGraficos();
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
      page: 0,
      // Se obtienen todos los registros coincidentes para que las tortas sean un
      // resumen real del conjunto y no solamente de la página visible.
      size: 1000
    }).subscribe({
      next: respuesta => {
        if (carga !== this.cargaActual) return;
        this.todosLosItems = respuesta.content;
        this.page = 0;
        this.actualizarPaginacion();
        this.loading = false;
        setTimeout(() => this.renderizarGraficos());
      },
      error: () => { if (carga === this.cargaActual) { this.error = 'No se pudieron cargar los desvíos del cliente.'; this.loading = false; } }
    });
  }

  limpiarFiltros(): void { this.filtros.reset(); this.limpiarFiltrosGraficos(); this.cargar(); }
  alCambiarAnio(evento: Event): void {
    const anio = (evento.target as HTMLSelectElement).value;
    this.filtros.controls.anio.setValue(anio);
    if (!anio) this.filtros.controls.mes.reset();
    this.cargar();
  }
  alCambiarMes(evento: Event): void { this.filtros.controls.mes.setValue((evento.target as HTMLSelectElement).value); this.cargar(); }
  quitarCliente(): void { ++this.cargaActual; this.clienteSeleccionado = undefined; this.busquedaCliente = ''; this.clientesVisibles = []; this.todosLosItems = []; this.page = 0; this.totalPages = 0; this.error = ''; this.filtros.reset(); this.limpiarFiltrosGraficos(); this.gravedadChart?.destroy(); this.avanceChart?.destroy(); }
  estadoClass(estado: EstadoDesvio): string { return estado === 'FINALIZADO' ? 'success' : estado === 'PERMANECE' ? 'danger' : estado === 'EN_PROCESO' ? 'warning' : 'info'; }
  porcentaje(estado: EstadoDesvio): number { return porcentajeParaEstado(estado); }
  gravedad(indice?: IndiceGravedadDesvio): string { return indice ? this.gravedadLabels[indice] : 'Sin clasificar'; }
  condicion(condicion?: CondicionOperacionDesvio): string { return condicion ? this.condicionLabels[condicion] : 'Sin clasificar'; }

  seleccionarGravedad(indice: IndiceGravedadDesvio | 'SIN_CLASIFICAR'): void {
    this.filtroGraficoGravedad = this.filtroGraficoGravedad === indice ? undefined : indice;
    this.page = 0; this.actualizarPaginacion(); this.renderizarGraficos();
  }

  seleccionarEstado(estado: EstadoDesvio): void {
    this.filtroGraficoEstado = this.filtroGraficoEstado === estado ? undefined : estado;
    this.page = 0; this.actualizarPaginacion(); this.renderizarGraficos();
  }

  irAPagina(page: number): void { this.page = page; }

  limpiarFiltrosGraficos(): void {
    this.filtroGraficoGravedad = undefined; this.filtroGraficoEstado = undefined;
    this.page = 0; this.actualizarPaginacion();
  }

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

  private filtrarPorGraficos(): DesvioListItem[] {
    return this.todosLosItems.filter(item =>
      (!this.filtroGraficoGravedad || (this.filtroGraficoGravedad === 'SIN_CLASIFICAR' ? !item.indiceGravedad : item.indiceGravedad === this.filtroGraficoGravedad)) &&
      (!this.filtroGraficoEstado || item.estado === this.filtroGraficoEstado)
    );
  }

  private actualizarPaginacion(): void {
    const cantidad = this.filtrarPorGraficos().length;
    this.totalPages = Math.ceil(cantidad / 20);
    if (this.totalPages && this.page >= this.totalPages) this.page = this.totalPages - 1;
  }

  renderizarGraficos(): void {
    if (!this.viewReady || !this.gravedadChartCanvas || !this.avanceChartCanvas) return;
    const gravedades: Array<IndiceGravedadDesvio | 'SIN_CLASIFICAR'> = ['MUY_LEVE', 'LEVE', 'MODERADO', 'GRAVE', 'CRITICO', 'SIN_CLASIFICAR'];
    const gravedadLabels = gravedades.map(g => g === 'SIN_CLASIFICAR' ? 'Sin clasificar' : this.gravedad(g));
    const gravedadValores = gravedades.map(g => this.todosLosItems.filter(item => g === 'SIN_CLASIFICAR' ? !item.indiceGravedad : item.indiceGravedad === g).length);
    const estadoValores = this.estados.map(estado => this.todosLosItems.filter(item => item.estado === estado).length);
    this.gravedadChart?.destroy(); this.avanceChart?.destroy();
    this.gravedadChart = this.crearGrafico(this.gravedadChartCanvas.nativeElement, gravedadLabels, gravedadValores, indice => this.seleccionarGravedad(gravedades[indice]), this.filtroGraficoGravedad ? gravedades.indexOf(this.filtroGraficoGravedad) : -1);
    this.avanceChart = this.crearGrafico(this.avanceChartCanvas.nativeElement, this.estados.map(e => `${this.labels[e]} (${this.porcentaje(e)}%)`), estadoValores, indice => this.seleccionarEstado(this.estados[indice]), this.filtroGraficoEstado ? this.estados.indexOf(this.filtroGraficoEstado) : -1);
  }

  private crearGrafico(canvas: HTMLCanvasElement, labels: string[], valores: number[], alSeleccionar: (indice: number) => void, seleccionado: number): Chart<'doughnut'> {
    const colores = ['#0d6efd', '#20c997', '#ffc107', '#fd7e14', '#dc3545', '#6c757d'];
    return new Chart(canvas, {
      type: 'doughnut', data: { labels, datasets: [{ data: valores, backgroundColor: colores, borderColor: '#fff', borderWidth: 2, offset: valores.map((_, i) => i === seleccionado ? 10 : 0) }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, padding: 10, font: { size: 11 } },
            // El clic en la referencia de color filtra la tabla como si fuera
            // la feta correspondiente; reemplaza al comportamiento por defecto
            // de Chart.js, que únicamente oculta el segmento del gráfico.
            onClick: (_evento, elemento) => {
              const indice = elemento.index;
              if (indice !== undefined) setTimeout(() => alSeleccionar(indice));
            }
          },
          tooltip: { callbacks: { label: contexto => `${contexto.label}: ${contexto.raw} desvío${contexto.raw === 1 ? '' : 's'}` } }
        },
        onClick: (evento, elementos, grafico) => {
          const elemento = elementos[0] ?? grafico.getElementsAtEventForMode(evento as unknown as Event, 'nearest', { intersect: true }, true)[0];
          // Se difiere la reconstrucción para no destruir el gráfico durante su
          // propio manejo de eventos.
          if (elemento) setTimeout(() => alSeleccionar(elemento.index));
        }
      }
    });
  }

}
