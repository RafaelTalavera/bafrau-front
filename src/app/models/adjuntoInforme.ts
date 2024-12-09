import { Informe } from "./informe.model";

export interface AdjuntoInforme {
    id?: number;
    urlAdjunto: string;
    descripcion: string;
    informe?: Informe; // Relación con Informe, opcional
  }