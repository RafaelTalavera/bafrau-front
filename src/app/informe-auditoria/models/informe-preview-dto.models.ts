// Modelos que reflejan lo que devuelve /informes/{id}/preview
export interface InformePreviewDTO {
  id: number;
  titulo: string;
  razonSocial: string;
  fecha: string; // o Date si tu back lo serializa así
  capitulos: PreviewCapituloLight[];
  secciones: PreviewSeccionFull[];
  tablas: PreviewTablaFull[];
}

export interface PreviewCapituloLight {
  id: number;
  titulo: string;
  orden: number;
  informeId: number;
}

export interface PreviewSeccionFull {
  id: number;
  capituloId: number;
  orden: number;
  contenido: string;
  styleTemplateId?: number | null;
  adjuntos: PreviewAdjuntoItem[];
}

export interface PreviewAdjuntoItem {
  id: number;
  descripcion: string;
  urlAdjunto: string;
}

export interface PreviewTablaFull {
  id: number;
  seccionId: number;
  nombre: string;
  filas: PreviewFilaFull[];
}

export interface PreviewFilaFull {
  id: number;
  numeroFila: number;
  celdas: PreviewCeldaFull[];
}

export interface PreviewCeldaFull {
  id: number;
  numeroColumna: number;
  contenido: string;
}


