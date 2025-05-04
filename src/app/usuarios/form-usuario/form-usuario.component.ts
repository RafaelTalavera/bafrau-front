import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  }
}
