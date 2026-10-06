import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Documento } from '../models/documento';
import { PROVINCIAS_ARGENTINAS } from '../models/provincia';

@Component({
  selector: 'app-form-documento',
  standalone: true,
 imports: [FormsModule, CommonModule],
  templateUrl: './form-documento.component.html',
  styleUrl: './form-documento.component.css'
})
export class FormDocumentoComponent implements AfterContentInit {

  readonly provincias = PROVINCIAS_ARGENTINAS;

@Input() documento: Documento = {
  id: 0, 
  nombre: '', 
  juridiccion: '',
  provinciaCodigo: null,
  observaciones: ''
};

 @Output() newDocumentoEvent = new EventEmitter<Documento>();

 ngAfterContentInit(): void {}

 onSubmit(documentoForm: NgForm): void {
  if (documentoForm.valid){
    console.log('Enviado para editar:', this.documento);
    this.newDocumentoEvent.emit({...this.documento});
    documentoForm.resetForm();
  }
 }

 clean(): void {
  this.documento = {
    id: 0,
    nombre: '',
    juridiccion: '',
    provinciaCodigo: null,
    observaciones: ''

  }
 }
}
