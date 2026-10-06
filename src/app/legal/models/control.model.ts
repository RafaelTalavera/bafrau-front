// src/app/legal/models/control.model.ts

export interface OrganizacionDTO {
  id: number;
  razonSocial: string;
  descripcion?: string | null;
}

export type ModalidadVencimiento = 'CORRIDOS' | 'HABILES';
export type AlcanceDiaNoLaborable = 'NACIONAL' | 'PROVINCIAL' | 'MUNICIPAL';

export interface PlazoVencimientoDTO {
  id?: number;
  dias: number;
}

export interface DiaNoLaborableDTO {
  id?: number;
  fecha: string;
  alcance: AlcanceDiaNoLaborable;
  municipio?: string | null;
  descripcion?: string | null;
}

export interface ItemControlDTO {
  id: number | null;
  documentoId: number;
  controlId: number;
  organizacionId?: number | null;
  vencimiento: string | null;
  presentacion: string | null;
  diasNotificacion: number;
  plazoVencimientoDias?: number | null;
  modalidadVencimiento?: ModalidadVencimiento | null;
  sinPlazo?: boolean | null;
  vencimientoManual?: boolean | null;
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
    vencimiento: string | null;
    presentacion: string | null;
    diasNotificacion: number;
    plazoVencimientoDias?: number | null;
    modalidadVencimiento?: ModalidadVencimiento | null;
    sinPlazo?: boolean | null;
    vencimientoManual?: boolean | null;
    listMail: string[];
    observaciones?: string;
    nombre: string;
    juridiccion: string;
    observacionesDocumento?: string;
    estado: boolean;
    deleted?: boolean;
  }[];
}
