// src/app/models/caratula-dto.ts
import { AdjuntoDTO } from '../../utils/adjunto-dto';

export interface CaratulaDTO {
  id?: number;
  titulo: string;
  elaborador: string;
  /** Formato "MM-yyyy" */
  fecha: string;
  informeId: number;
  /** Para creación masiva de adjuntos */
  adjuntos?: AdjuntoDTO[];
  /** Para gestión de adjuntos existentes */
  adjuntosIds?: number[];
}
