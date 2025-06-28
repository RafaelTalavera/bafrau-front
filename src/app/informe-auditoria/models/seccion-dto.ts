
export interface SeccionDTO {
  id?: number;
  orden: number;
  contenido: string;
  capituloId: number;
  styleTemplateId: number;
  organizacionId?: number;
  razonSocial?: string;
  adjuntosIds: number[];

  // Propiedades sólo para el frontend
  styleTemplateNombre?: string;
  adjuntos?: {
    id: number;
    urlAdjunto: string;
  }[];
}
