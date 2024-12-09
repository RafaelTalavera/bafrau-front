import { AfterContentInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { Factor } from '../../../models/factor';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-factor',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './form-factor.component.html',
  styleUrl: './form-factor.component.css'
})
export class FormFactorComponent implements AfterContentInit {
  
  ngAfterContentInit(): void {
  }

  @Input() factor: Factor = {
    id: 0,
    clasificacion: '',
    tipo: ''
  };

@Output() newFactorEvent = new EventEmitter();

onSubmit(factorForm: NgForm): void {
  if (factorForm.valid){
    this.newFactorEvent.emit(this.factor)
  }
  factorForm.reset();
  factorForm.resetForm();
}

clean(): void {
  this.factor = {
    id: 0,
    clasificacion: '',
    tipo: ''
  }
}

}
