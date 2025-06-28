import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import Swal from 'sweetalert2';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NavComponent } from '../../../gobal/nav/nav.component';
import { FooterComponent } from '../../../gobal/footer/footer.component';
import { Inventario } from '../../models/inventario';
import { InventarioService } from '../../service/inventario.residuos.service';
import { OrganizacionService } from '../../../organizacion/service/organizacion-service';
import { ResiduoService } from '../../service/residuo.service';
import { ItemInventario } from '../../models/ItemInventario';
import { InventarioPayload } from '../../models/inventario-payload';
import { SpinnerComponent } from '../../../utils/spinner/spinner.component';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [FormsModule,
           CommonModule, 
           NavComponent, 
           FooterComponent, 
           HttpClientModule,
            SpinnerComponent  
          ],
  templateUrl: './residuo-inventario.component.html',
  styleUrls: ['./residuo-inventario.component.css']
})
export class ResiduoInventarioComponent implements OnInit {

  inventarioForm: Inventario = {
    fecha: '',
    organizacionId: 0,
    contrato: '',
    razonSocial:'',
    items: []
  };
  inventarios: Inventario[] = [];
  organizaciones: any[] = [];
  organizacionMap: Record<number,string> = {};
  allCorrientes: any[] = [];
  selectedJuridiccion = '';
  selectedCorriente = '';
  selectedDetalle = '';
  selectedCorrienteId: number|null = null;
  mostrarDetalles = false;
  inventarioSeleccionado: Inventario|null = null;
  editMode = false;
  currentInventarioId: number|null = null;
  errorMessage = '';
  rrppList: string[] = [];
  loading = false; 

  constructor(
    private inventarioService: InventarioService,
    private organizacionService: OrganizacionService,
    private residuoService: ResiduoService,
    private http: HttpClient,
    ) {}

  ngOnInit(): void {
    this.loading = true; 
    this.getOrganizacionesRepresentacionTecnica();
    this.getCorrientes();
  }

   getOrganizacionesRepresentacionTecnica(): void {
    this.organizacionService.getOrganizacionesRepresentacionTecnica().subscribe(
      data => {
        this.organizaciones = data;
        this.organizacionMap = data.reduce((m, org) => {
          m[org.id!] = org.razonSocial;
          return m;
        }, {} as Record<number,string>);
        this.getInventarios();                      // ← sólo quito spinner aquí
      },
      error => {
        this.errorMessage = 'Error al obtener organizaciones.';
        this.loading = false;
      }
    );
  }

  getInventarios(): void {
    this.inventarioService.getInventarios().subscribe(
      data => {
        this.inventarios = data;
        this.loading = false;                       // ← detiene spinner
      },
      error => {
        this.errorMessage = 'Error al obtener inventarios.';
        this.loading = false;
      }
    );
  }

  getCorrientes(): void {
    this.residuoService.findAll().subscribe(
      data => {
        this.allCorrientes = data;
      },
      error => console.error('Error al obtener corrientes:', error)
    );
  }

  getJuridiccion(): string[] {
    return Array.from(new Set(this.allCorrientes.map(c => c.juridiccion)));
  }

  getCorriente(): string[] {
    return this.selectedJuridiccion
      ? Array.from(new Set(
          this.allCorrientes
            .filter(c => c.juridiccion === this.selectedJuridiccion)
            .map(c => c.corriente)
        ))
      : [];
  }

  getDescripciones(): string[] {
    return (this.selectedJuridiccion && this.selectedCorriente)
      ? Array.from(new Set(
          this.allCorrientes
            .filter(c =>
              c.juridiccion === this.selectedJuridiccion &&
              c.corriente === this.selectedCorriente
            )
            .map(c => c.detalle)
        ))
      : [];
  }

  updateCorrienteSeleccionada(): void {
    const corriente = this.allCorrientes.find(c =>
      c.detalle === this.selectedDetalle &&
      c.corriente === this.selectedCorriente &&
      c.juridiccion === this.selectedJuridiccion
    );
    this.selectedCorrienteId = corriente?.id ?? null;

  }

  addItemToInventario(): void {
    this.updateCorrienteSeleccionada();
    if (!this.selectedCorrienteId) {
      Swal.fire('Error', 'Debe seleccionar una corriente válida.', 'error');
      return;
    }
    const corr = this.allCorrientes.find(c => c.id === this.selectedCorrienteId)!;
    this.inventarioForm.items.push(new ItemInventario({
      id: null,
      inventario: this.inventarioForm,
      residuo: {
        id: corr.id,
        corriente: corr.corriente,
        detalle: corr.detalle,
        juridiccion: corr.juridiccion
      }
    }));
    this.selectedJuridiccion = '';
    this.selectedCorriente = '';
    this.selectedDetalle = '';
    this.selectedCorrienteId = null;
    Swal.fire('Éxito', 'Item agregado al inventario.', 'success');
  }

  onSubmit(): void {
    if (!this.inventarioForm.fecha || this.inventarioForm.organizacionId === 0) {
      Swal.fire('Error', 'Por favor, complete los campos obligatorios.', 'error');
      return;
    }
    if (this.inventarioForm.items.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un item al inventario.', 'error');
      return;
    }
  const payload: InventarioPayload = {
    fecha: this.inventarioForm.fecha,
    organizacionId: this.inventarioForm.organizacionId,
    contrato: this.inventarioForm.contrato,  // aquí incluimos RRPP como "contrato"
    items: this.inventarioForm.items.map(item => ({
      residuo: { id: item.residuo!.id }
    }))
  };
    if (this.editMode && this.currentInventarioId !== null) {
      this.inventarioService.updateInventario(this.currentInventarioId, payload).subscribe(
        () => { Swal.fire('Actualizado', 'Inventario actualizado correctamente.', 'success'); this.getInventarios(); this.resetForm(); },
        () => Swal.fire('Error', 'No se pudo actualizar el inventario.', 'error')
      );
    } else {
      this.inventarioService.createInventario(payload).subscribe(
        () => { Swal.fire('Creado', 'Inventario creado correctamente.', 'success'); this.getInventarios(); this.resetForm(); },
        () => Swal.fire('Error', 'No se pudo crear el inventario.', 'error')
      );
    }
  }

  resetForm(): void {
    this.inventarioForm = { fecha: '', organizacionId: 0, razonSocial: '',contrato : '', items: [] };
    this.editMode = false;
    this.currentInventarioId = null;
    this.selectedJuridiccion = '';
    this.selectedCorriente = '';
    this.selectedDetalle = '';
    this.selectedCorrienteId = null;
  }

  editInventario(inventario: Inventario): void {
    this.editMode = true;
    this.currentInventarioId = inventario.id!;
    this.inventarioForm = { ...inventario, items: [...(inventario.items || [])] };
  }

  deleteInventario(id: number): void {
    Swal.fire({
      title: 'Confirmar eliminación',
      text: '¿Está seguro de eliminar este inventario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.inventarioService.deleteInventario(id).subscribe(
          () => { Swal.fire('Eliminado', 'El inventario se eliminó correctamente.', 'success'); this.getInventarios(); },
          error => { console.error('Error al eliminar el inventario:', error); Swal.fire('Error', 'No se pudo eliminar el inventario.', 'error'); }
        );
      }
    });
  }

  verDetallesInventario(inventario: Inventario): void {
    this.inventarioService.getItemsByInventario(inventario.id!).subscribe(
      items => { inventario.items = items; this.inventarioSeleccionado = inventario; this.mostrarDetalles = true; },
    );
  }

  cerrarDetalles(): void {
    this.mostrarDetalles = false;
    this.inventarioSeleccionado = null;
  }

  getOrgName(id: number): string {
    return this.organizacionMap[id] || '–';
  }

  onOrganizacionChange(orgId: number): void {
  const org = this.organizaciones.find(o => o.id === orgId);
  this.rrppList = org?.rrpp ?? [];
}

}
