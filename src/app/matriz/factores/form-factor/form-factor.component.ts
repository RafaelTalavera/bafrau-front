// src/app/matriz/factores/form-factor/form-factor.component.ts
import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { Factor } from '../../models/factor';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-factor',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './form-factor.component.html',
  styleUrls: ['./form-factor.component.css']
})
export class FormFactorComponent implements AfterContentInit {

  @Input() factor: Factor = {
    id: 0,
    sistema: '',
    subsistema: '',
    factor: '',
    componente: ''
  };

  @Output() newFactorEvent = new EventEmitter<Factor>();

  ngAfterContentInit(): void {}

  onSubmit(factorForm: NgForm): void {
    if (factorForm.valid) {
      console.log('Enviando para editar:', this.factor);
      this.newFactorEvent.emit({ ...this.factor });  // emitir copia para conservar id
      factorForm.resetForm();                        // sólo reset del formulario
    }
  }

  clean(): void {
    this.factor = {
      id: 0,
      sistema: '',
      subsistema: '',
      factor: '',
      componente: ''
    };
  }
}
