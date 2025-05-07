// src/app/legal/models/control.model.ts

// DTO para Organización (si lo necesitas para mostrar nombre; opcional según tu lógica)
export interface OrganizacionDTO {
  id: number;
  razonSocial: string;
}

// DTO de cada ítem de Control según tu JSON actualizado
export interface ItemControlDTO {
  id: number;
  documentoId: number;
  controlId: number;
  vencimiento: string;              // ISO (yyyy-MM-dd)
  listMail: string[];
  observaciones: string | null;
  nombre: string;
  juridiccion: string;
  observacionesDocumento: string;
}

// DTO completo de Control según tu JSON
export interface ControlDTO {
  id: number;
  organizacionId: number;
  fecha: string;                    // ISO (yyyy-MM-dd)
  items: ItemControlDTO[];
  organizacionRazonSocial: string;
}

// Payload para crear/actualizar Control (ajusta según tu API)
export interface ControlPayload {
  fecha: string;                    // ISO (yyyy-MM-dd)
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
