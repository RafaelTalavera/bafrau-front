// src/app/legal/models/control.model.ts

export interface OrganizacionDTO {
  id: number;
  razonSocial: string;
}

export interface ItemControlDTO {
  id: number;
  documentoId: number;
  controlId: number;
  vencimiento: string;  
  diasNotificacion: number;           
  listMail: string[];
  observaciones: string | null;
  nombre: string;
  juridiccion: string;
  observacionesDocumento: string;
}

export interface ControlDTO {
  id: number;
  organizacionId: number;
  fecha: string;                   
  items: ItemControlDTO[];
  organizacionRazonSocial: string;
}

export interface ControlPayload {
  fecha: string;                    
  organizacionId: number;
  items: {
    documentoId: number;
    vencimiento: string;
    listMail: string[];
    observaciones?: string;
    nombre: string;
    juridiccion: string;
    observacionesDocumento?: string;
  }[];
}
