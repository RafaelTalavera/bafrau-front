import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  error(title: string, message: string, technicalReference?: string | null): Promise<void> {
    return this.modal('error', title, this.withReference(message, technicalReference));
  }

  warning(title: string, message: string): Promise<void> {
    return this.modal('warning', title, message);
  }

  sessionEnded(message: string): Promise<void> {
    return this.modal('warning', 'Sesión finalizada', message, 'Ir al inicio de sesión');
  }

  success(message: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    return Swal.fire({ icon: 'success', title: message, toast: true, position: 'top-end', timer: 2500,
      timerProgressBar: true, showConfirmButton: false }).then(() => undefined);
  }

  private modal(icon: SweetAlertIcon, title: string, text: string, confirmButtonText = 'Aceptar'): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    return Swal.fire({ icon, title, text, confirmButtonText, allowOutsideClick: false,
      allowEscapeKey: false }).then(() => undefined);
  }

  private withReference(message: string, technicalReference?: string | null): string {
    return technicalReference ? `${message}\n\nReferencia técnica: ${technicalReference}` : message;
  }
}
