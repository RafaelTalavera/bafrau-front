import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Usuario } from '../usuario';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './form-usuario.component.html',
  styleUrls: ['./form-usuario.component.css']  // Corrección: styleUrls en lugar de styleUrl
})
export class FormUsuarioComponent {
  @ViewChild('usuarioForm') usuarioForm?: NgForm;
  @Input() usuario: Usuario = new Usuario();
  @Output() newUsuarioEvent = new EventEmitter<Usuario>();

  onSubmit(usuarioForm: NgForm): void {
    if (usuarioForm.valid) {
      this.newUsuarioEvent.emit(this.usuario);
    }
    usuarioForm.resetForm();
  }

  clean(): void {
    this.usuario = new Usuario(); // Reiniciar usando el constructor
    this.usuarioForm?.resetForm(this.usuario);
  }

  hasUnsavedChanges(): boolean {
    return !!this.usuarioForm?.dirty;
  }

  markAsPristine(): void {
    this.usuarioForm?.form.markAsPristine();
  }
}
