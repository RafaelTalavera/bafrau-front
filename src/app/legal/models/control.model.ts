// src/app/legal/models/control.model.ts

/** DTO de una organización */
export interface OrganizacionDTO {
  id: number;
  razonSocial: string;
}

/** DTO de un ítem de control tal como lo devuelve el backend */
export interface ItemControlDTO {
  /** Si viene de BD: número; si es nuevo: null */
  id: number | null;
  documentoId: number;
  controlId: number;

  /** La API puede devolver null */
  vencimiento: string | null;
  presentacion: string | null;

  diasNotificacion: number;
  listMail: string[];

  /** Si la API lo devuelve como null */
  observaciones: string | null;

  estado: boolean;

  /** Campos de auditoría, opcionales */
  createdDate?: string | null;
  lastModifiedDate?: string | null;

  nombre: string;
  juridiccion: string;

  /** Opcional si la API lo devuelve así */
  observacionesDocumento?: string | null;

  razonSocial?: string | null;
}

/** DTO de un control completo, con sus ítems */
export interface ControlDTO {
  id: number;
  organizacionId: number;
  fecha: string;
  organizacionRazonSocial: string;
  items: ItemControlDTO[];
}

/** Payload para crear/editar un control */
export interface ControlPayload {
  organizacionId: number;
  items: {
    /** Permitimos null para los ítems nuevos */
    id: number | null;
    documentoId: number;
    vencimiento: string;
    presentacion: string;
    diasNotificacion: number;
    listMail: string[];
    /** Opcional para no romper si viene vacío */
    observaciones?: string;
    nombre: string;
    juridiccion: string;
    observacionesDocumento?: string;
    estado: boolean;
  }[];
}
