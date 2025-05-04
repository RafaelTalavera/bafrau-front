import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; 
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FormUsuarioComponent } from './form-usuario/form-usuario.component';
import { Usuario } from './usuario';
import { UsuariosService } from './services/usuarios.service';
import { FooterComponent } from '../gobal/footer/footer.component';
import { NavComponent } from '../gobal/nav/nav.component';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormUsuarioComponent, CommonModule, FormsModule, FooterComponent,NavComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  showError: boolean = false;
  dniBusqueda: string = '';
  usuariosFiltrados: Usuario[] = [];
  usuarioSelected: Usuario = new Usuario();

  constructor(private service: UsuariosService, private router: Router) {}

  ngOnInit(): void {
    this.service.findAll().pipe(
      catchError((error) => {
        console.error('Error fetching usuarios:', error);
        if (error.status !== 200) {
          this.showError = true;
        }
        return of([]); // Return an empty array or appropriate default value on error
      })
    ).subscribe(
      (usuarios) => {
        console.log('Usuarios data:', usuarios);
        this.usuarios = usuarios;
        this.buscarPorDNI(); // Inicializa la lista filtrada
      }
    );
  }

  addUsuario(usuario: Usuario) {
    if (usuario.id > 0) {
      this.service.updateUsuario(usuario).subscribe(usuarioUpdated => {
        // Reemplazamos en el array y volvemos a filtrar
        this.usuarios = this.usuarios.map(u => u.id === usuario.id ? usuarioUpdated : u);
        this.buscarPorDNI();  // ← aquí
        Swal.fire('Usuario Actualizado', 'El usuario se ha actualizado con éxito', 'success');
      });
    } else {
      this.service.create(usuario).subscribe(usuarioNew => {
        // Añadimos al array y volvemos a filtrar
        this.usuarios.push(usuarioNew);
        this.buscarPorDNI();  // ← aquí
        Swal.fire('Usuario Creado', 'El usuario se ha creado con éxito', 'success');
      });
    }
    this.usuarioSelected = new Usuario();
  }

  onUpdateUsuario(usuarioRow: Usuario) {
    this.usuarioSelected = { ...usuarioRow };
  }

  onRemoveUsuario(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que deseas eliminar este usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.remove(id).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Usuario Eliminado',
            text: 'El usuario se ha eliminado con éxito',
          });
          // Actualiza la lista de usuarios después de eliminar
          this.actualizarUsuarios();
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          icon: 'info',
          title: 'Eliminación cancelada',
          text: 'La eliminación del usuario ha sido cancelada',
        });
      }
    });
  }
  
  actualizarUsuarios(): void {
    this.service.findAll().subscribe(
      (usuarios) => {
        this.usuarios = usuarios;
        this.buscarPorDNI(); // Actualiza la lista filtrada
      },
      (error) => {
        console.error('Error al actualizar la lista de usuarios:', error);
      }
    );
  }
  

  buscarPorDNI(): void {
    if (this.dniBusqueda.trim() === '') {
      this.usuariosFiltrados = this.usuarios;
    } else {
      this.usuariosFiltrados = this.usuarios.filter(usuario =>
        usuario.dni.toLowerCase().includes(this.dniBusqueda.toLowerCase())
      );
    }
  }

  trackByFn(index: number, item: Usuario): number {
    return item.id; // O cualquier campo único en tu objeto Organizador
  }
}
