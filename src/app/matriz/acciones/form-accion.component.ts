import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Accion } from '../../models/matriz';


@Component({
  selector: 'app-form-accion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './form-accion.component.html',
  styleUrl: './form-accion.component.css'
})
export class FormAccionComponent implements AfterContentInit {
  
  ngAfterContentInit(): void {
  }

  @Input() accion: Accion = {
    id: 0,
    clasificacion: '',
    tipo: ''
  };

@Output() newAccionEvent = new EventEmitter();

onSubmit(accionForm: NgForm): void {
  if (accionForm.valid){
    this.newAccionEvent.emit(this.accion)
  }
  accionForm.reset();
  accionForm.resetForm();
}

clean(): void {
  this.accion = {
    id: 0,
    clasificacion: '',
    tipo: ''
  }
}

}
