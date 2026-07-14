import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import Swal from 'sweetalert2';
import { CanComponentDeactivate } from '../guards/pending-changes.guard';
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
export class UsuariosComponent implements OnInit, CanComponentDeactivate {
  @ViewChild(FormUsuarioComponent) private formUsuarioComponent?: FormUsuarioComponent;

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

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.hasPendingChanges()) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  }

  get usuariosActivosCount(): number {
    return this.usuarios.filter((usuario) => this.isUsuarioActivo(usuario)).length;
  }

  get usuariosBloqueadosCount(): number {
    return this.usuarios.length - this.usuariosActivosCount;
  }

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
        this.formUsuarioComponent?.markAsPristine();
        Swal.fire('Usuario actualizado', 'El usuario se ha actualizado con exito', 'success');
      });
    } else {
      this.service.create(usuario).subscribe((usuarioNew) => {
        this.usuarios.push(usuarioNew);
        this.buscarPorDNI();
        this.formUsuarioComponent?.markAsPristine();
        Swal.fire('Usuario creado', 'El usuario se ha creado con exito', 'success');
      });
    }

    this.usuarioSelected = new Usuario();
  }

  async onUpdateUsuario(usuarioRow: Usuario): Promise<void> {
    if (!(await this.confirmDiscardChanges())) {
      return;
    }

    this.usuarioSelected = { ...usuarioRow };
    this.formUsuarioComponent?.markAsPristine();
  }

  onToggleBloqueo(usuario: Usuario): void {
    const estaActivo = this.isUsuarioActivo(usuario);
    const accion = estaActivo ? 'bloquear' : 'desbloquear';
    const accionCapitalizada = estaActivo ? 'Bloquear' : 'Desbloquear';

    Swal.fire({
      title: `${accionCapitalizada} usuario`,
      text: `Confirmas ${accion} este usuario?`,
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
            ? 'No tenes permisos para esta accion'
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

  canDeactivate(): boolean | Promise<boolean> {
    return this.confirmDiscardChanges();
  }

  private upsertUsuario(usuarioActualizado: Usuario): void {
    this.usuarios = this.usuarios.map((u) => u.id === usuarioActualizado.id ? usuarioActualizado : u);
    this.usuariosFiltrados = this.usuariosFiltrados.map((u) => u.id === usuarioActualizado.id ? usuarioActualizado : u);
  }

  private hasPendingChanges(): boolean {
    return this.formUsuarioComponent?.hasUnsavedChanges() ?? false;
  }

  private async confirmDiscardChanges(): Promise<boolean> {
    if (!this.hasPendingChanges()) {
      return true;
    }

    const result = await Swal.fire({
      title: 'Cambios sin guardar',
      text: 'Hay cambios sin guardar. Queres salir de esta pantalla sin guardar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Salir sin guardar',
      cancelButtonText: 'Continuar editando',
      reverseButtons: true
    });

    return result.isConfirmed;
  }
}
