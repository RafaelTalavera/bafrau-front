// src/app/models/encabezado-dto.ts

import { AdjuntoDTO } from "../../utils/adjunto-dto";


export interface EncabezadoDTO {
  id: number;
  contenido: string;
  informeId: number;
  styleTemplateId: number;
  adjuntos: AdjuntoDTO[];
  adjuntosIds: number[];
  // Auditoría
  createdBy: string;
  createdDate: string;        // ISO 8601, p. ej. "2025-06-20T11:45:00Z"
  lastModifiedBy: string;
  lastModifiedDate: string;   // ISO 8601
}
