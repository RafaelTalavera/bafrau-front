import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { Residuo } from '../models/residuo';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-residuo',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './form-residuo.component.html',
  styleUrl: './form-residuo.component.css'
})
export class FormResiduoComponent implements AfterContentInit {

@Input() residuo: Residuo = {
  id: 0, 
  corriente: '', 
  juridiccion: '',
  detalle: ''
};

 @Output() newResiduoEvent = new EventEmitter<Residuo>();

 ngAfterContentInit(): void {}

 onSubmit(residuoForm: NgForm): void {
  if (residuoForm.valid){
    this.newResiduoEvent.emit({...this.residuo});
    residuoForm.resetForm();
  }
 }

 clean(): void {
  this.residuo = {
    id: 0,
    corriente: '',
    juridiccion: '',
    detalle: ''
  }
 }
}

