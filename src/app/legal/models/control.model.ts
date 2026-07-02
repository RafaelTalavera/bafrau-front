// src/app/legal/models/control.model.ts

export interface OrganizacionDTO {
  id: number;
  razonSocial: string;
}

export interface ItemControlDTO {
  id: number | null;
  documentoId: number;
  controlId: number;
  vencimiento: string | null;
  presentacion: string | null;
  diasNotificacion: number;
  listMail: string[];
  observaciones: string | null;
  estado: boolean;
  deleted?: boolean;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
  nombre: string;
  juridiccion: string;
  observacionesDocumento?: string | null;
  razonSocial?: string | null;
}

export interface ControlDTO {
  id: number;
  organizacionId: number;
  fecha: string;
  organizacionRazonSocial: string;
  items: ItemControlDTO[];
}

export interface ControlPayload {
  organizacionId: number;
  items: {
    id: number | null;
    documentoId: number;
    vencimiento: string;
    presentacion: string | null;
    diasNotificacion: number;
    listMail: string[];
    observaciones?: string;
    nombre: string;
    juridiccion: string;
    observacionesDocumento?: string;
    estado: boolean;
    deleted?: boolean;
  }[];
}
