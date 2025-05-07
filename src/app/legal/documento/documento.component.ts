import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Documento } from '../models/documento';
import { Router } from '@angular/router';
import { of } from 'rxjs'; // Faltaba importar 'of'
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { DocumentoService } from '../service/documento.service';
import { FormDocumentoComponent } from "../form-documento/form-documento.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../../gobal/footer/footer.component';
import { NavComponent } from '../../gobal/nav/nav.component';


@Component({
  selector: 'app-documento',
  standalone: true,
  imports: [FormDocumentoComponent, CommonModule, FormsModule, FooterComponent, NavComponent],
  templateUrl: './documento.component.html',
  styleUrls: ['./documento.component.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], 
})
export class DocumentoComponent implements OnInit {
  documentos: Documento[] = [];
  documentosFiltrados: Documento[] = []; // Error: era un solo objeto, debe ser un array
  showError = false;
  tipoBusqueda = '';
  documentoSelected: Documento = new Documento(); // Estaba mal escrito en varios lados

  constructor(
    private service: DocumentoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshDocumentos();
  }

  refreshDocumentos(): void {
    this.service.findAll().pipe(
      catchError(error => {
        console.error('Error fetching documentos:', error);
        this.showError = true;
        return of([]);
      })
    ).subscribe(data => {
      this.documentos = data;
      this.buscarPorTipo();
    });
  }

  addDocumento(documento: Documento): void {
    console.log('Recibido en padre:', documento);
    if (documento.id > 0) {
      this.service.updateDocumento(documento).subscribe(() => {
        Swal.fire('Documento Actualizado', 'El documento se ha actualizado con éxito', 'success');
        this.refreshDocumentos();
        this.documentoSelected = new Documento(); // Corrección de nombre
      });
    } else {
      this.service.create(documento).subscribe(() => { // 'Documento' con mayúscula estaba mal
        Swal.fire('Documento Creado', 'El Documento se ha creado con éxito', 'success');
        this.refreshDocumentos();
        this.documentoSelected = new Documento();
      });
    }
  }

  onUpdateDocumento(documentoRow: Documento): void {
    this.documentoSelected = { ...documentoRow };
  }

  onRemoveDocumento(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar este documento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) {
        this.service.remove(id).subscribe(() => {
          Swal.fire('Documento Eliminado', 'El documento se ha eliminado con éxito', 'success');
          this.refreshDocumentos();
        });
      }
    });
  }

  buscarPorTipo(): void {
    if (this.tipoBusqueda.trim() === '') {
      this.documentosFiltrados = this.documentos;
    } else {
      this.documentosFiltrados = this.documentos.filter(f =>
        f.juridiccion?.toLowerCase().includes(this.tipoBusqueda.toLowerCase()) // Evita error si es undefined
      );
    }
  }

  trackByFn(index: number, item: Documento): number {
    return item.id;
  }
}
