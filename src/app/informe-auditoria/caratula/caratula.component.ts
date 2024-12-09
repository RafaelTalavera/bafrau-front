import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-caratula',
  standalone: true,
  templateUrl: './caratula.component.html', // Asegúrate de que esta ruta es correcta
  styleUrls: ['./caratula.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class CaratulaComponent implements OnInit {
  @Input() razonSocial: string = ''; // Valor que viene del componente padre
  anio: number = new Date().getFullYear(); // Año actual
  caratulaForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Inicializamos el formulario
    this.caratulaForm = this.fb.group({
      razonSocial: [this.razonSocial],
      anio: [this.anio],
    });
  }

  limpiarCampos(): void {
    this.caratulaForm.reset({ razonSocial: '', anio: this.anio });
  }

  confirmar(): void {
    console.log('Formulario confirmado:', this.caratulaForm.value);
  }
}
