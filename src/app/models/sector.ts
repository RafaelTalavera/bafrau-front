import { Informe } from "../organizacion/models/organizacion.model";

export interface Sector {
    id?: number; // Lo hacemos opcional para nuevas instancias
    sector: string; // Nombre del sector
    m2: number; // Tamaño en metros cuadrados
    informe?: Informe; // Relación con Informe, opcional
  }