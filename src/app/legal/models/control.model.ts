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
  estado: boolean; 
  presentacion:string; 
  diasNotificacion: number;           
  listMail: string[];
  observaciones: string | null;
  nombre: string;
  juridiccion: string;
  observacionesDocumento: string;
    semaforo?: 'red' | 'yellow' | 'green';
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
    presentacion: string;     
    listMail: string[];
    observaciones?: string;
    nombre: string;
    juridiccion: string;
    observacionesDocumento?: string;
  }[];
}
