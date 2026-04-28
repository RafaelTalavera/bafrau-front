import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FormUsuarioComponent } from './form-usuario/form-usuario.component';
import { Usuario } from './usuario';
import { UsuariosService } from './services/usuarios.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormUsuarioComponent, CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  showError = false;
  dniBusqueda = '';
  usuariosFiltrados: Usuario[] = [];
  usuarioSelected: Usuario = new Usuario();
  rowActionLoading: Record<number, boolean> = {};
  rowActionError: Record<number, string | null> = {};

  private readonly toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true
  });

  constructor(private service: UsuariosService) {}

  ngOnInit(): void {
    this.service.findAll().pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 200) {
          this.showError = true;
        }
        return of([] as Usuario[]);
      })
    ).subscribe((usuarios) => {
      this.usuarios = usuarios;
      this.buscarPorDNI();
    });
  }

  addUsuario(usuario: Usuario): void {
    if (usuario.id > 0) {
      this.service.updateUsuario(usuario).subscribe((usuarioUpdated) => {
        this.usuarios = this.usuarios.map((u) => u.id === usuario.id ? usuarioUpdated : u);
        this.buscarPorDNI();
        Swal.fire('Usuario actualizado', 'El usuario se ha actualizado con exito', 'success');
      });
    } else {
      this.service.create(usuario).subscribe((usuarioNew) => {
        this.usuarios.push(usuarioNew);
        this.buscarPorDNI();
        Swal.fire('Usuario creado', 'El usuario se ha creado con exito', 'success');
      });
    }

    this.usuarioSelected = new Usuario();
  }

  onUpdateUsuario(usuarioRow: Usuario): void {
    this.usuarioSelected = { ...usuarioRow };
  }

  onToggleBloqueo(usuario: Usuario): void {
    const estaActivo = this.isUsuarioActivo(usuario);
    const accion = estaActivo ? 'bloquear' : 'desbloquear';
    const accionCapitalizada = estaActivo ? 'Bloquear' : 'Desbloquear';

    Swal.fire({
      title: `${accionCapitalizada} usuario`,
      text: `¿Confirmas ${accion} este usuario?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Si, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.rowActionLoading[usuario.id] = true;
      this.rowActionError[usuario.id] = null;

      const request$ = estaActivo
        ? this.service.bloquearUsuario(usuario.id)
        : this.service.desbloquearUsuario(usuario.id);

      request$.pipe(
        finalize(() => {
          this.rowActionLoading[usuario.id] = false;
        })
      ).subscribe({
        next: (usuarioActualizado) => {
          this.upsertUsuario(usuarioActualizado);
          this.toast.fire({
            icon: 'success',
            title: estaActivo ? 'Usuario bloqueado' : 'Usuario desbloqueado'
          });
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = error.status === 403
            ? 'No tenés permisos para esta acción'
            : 'No se pudo actualizar el estado del usuario';

          this.rowActionError[usuario.id] = errorMessage;
          this.toast.fire({
            icon: 'error',
            title: errorMessage
          });
        }
      });
    });
  }

  actualizarUsuarios(): void {
    this.service.findAll().subscribe(
      (usuarios) => {
        this.usuarios = usuarios;
        this.buscarPorDNI();
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
      const filtro = this.dniBusqueda.toLowerCase();
      this.usuariosFiltrados = this.usuarios.filter((usuario) =>
        usuario.dni.toLowerCase().includes(filtro)
      );
    }
  }

  trackByFn(index: number, item: Usuario): number {
    return item.id;
  }

  isUsuarioActivo(usuario: Usuario): boolean {
    return usuario.activo !== false;
  }

  getEstadoLabel(usuario: Usuario): string {
    return this.isUsuarioActivo(usuario) ? 'Activo' : 'Bloqueado';
  }

  getUsernameVisual(usuario: Usuario): string {
    const valor = usuario.username || '';
    return valor.includes('@') ? valor.split('@')[0] : valor;
  }
  private upsertUsuario(usuarioActualizado: Usuario): void {
    this.usuarios = this.usuarios.map((u) => u.id === usuarioActualizado.id ? usuarioActualizado : u);
    this.usuariosFiltrados = this.usuariosFiltrados.map((u) => u.id === usuarioActualizado.id ? usuarioActualizado : u);
  }
}

