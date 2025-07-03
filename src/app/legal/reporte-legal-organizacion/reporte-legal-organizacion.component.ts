import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import * as ExcelJS from 'exceljs';


import { NavComponent } from '../../gobal/nav/nav.component';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { SpinnerComponent } from '../../utils/spinner/spinner.component';
import { ControlService } from '../service/control.service';
import { OrganizacionDTO, ItemControlDTO } from '../models/control.model';
import saveAs from 'file-saver';

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
  filtroRazon = '';
  showOrgList = true;
  showItems = false;
  selectedOrgName = '';

  constructor(
    private controlService: ControlService,
    private http: HttpClient
  ) {}

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
    return term
      ? this.organizaciones.filter(o => o.razonSocial.toLowerCase().includes(term))
      : this.organizaciones;
  }

  verReporte(orgId: number): void {
    const org = this.organizaciones.find(o => o.id === orgId);
    this.selectedOrgName = org?.razonSocial || '';

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
        console.error(`Error al cargar ítems para org ${orgId}`, err);
        this.itemsLoading = false;
        Swal.fire('Error', 'No se pudieron cargar los ítems', 'error');
      }
    });
  }

  volverListado(): void {
    this.showOrgList = true;
    this.showItems = false;
  }

  async exportToExcel(): Promise<void> {
    // 1. Crear libro y hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Informe');

    // 2. Cargar logo y agregar
    const logoUrl = 'assets/dist/img/logo-letras.png';
    const blob = await this.http.get(logoUrl, { responseType: 'blob' }).toPromise();
    const buffer: ArrayBuffer = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as ArrayBuffer);
      reader.onerror = err => rej(err);
      reader.readAsArrayBuffer(blob!);
    });
    const imageId = workbook.addImage({ buffer, extension: 'png' });
    worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 200, height: 57 } });

    // 3. Título, org y fecha
    worksheet.mergeCells('C1:F1');
    worksheet.getCell('C1').value = 'Informe de seguimiento legal';
    worksheet.getCell('C1').font = { size: 16, bold: true };

    worksheet.mergeCells('C2:F2');
    worksheet.getCell('C2').value = this.selectedOrgName;
    worksheet.getCell('C2').font = { size: 12 };

    worksheet.mergeCells('C3:F3');
    worksheet.getCell('C3').value = new Date().toLocaleDateString('es-AR');
    worksheet.getCell('C3').font = { size: 12 };

    // 4. Encabezados de tabla
    const header = ['ID', 'Nombre', 'Vencimiento', 'Presentación', 'Observaciones'];
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 5. Datos
    this.items.forEach(it => {
      worksheet.addRow([
        it.id,
        it.nombre,
        new Date(it.vencimiento),
        new Date(it.presentacion),
        it.observaciones
      ]);
    });

    // 6. Ancho de columnas
    worksheet.columns = [
      { width: 10 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 40 }
    ];

    // 7. Guardar archivo
    const bufferOut = await workbook.xlsx.writeBuffer();
    const fileName = `informe_${this.selectedOrgName}_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`;
    saveAs(new Blob([bufferOut]), fileName);
  }
}
