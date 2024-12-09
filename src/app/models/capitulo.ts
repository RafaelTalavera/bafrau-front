import { Informe } from "./informe.model";


export interface Capitulo {
    id?: number;
    titulo: string;
    descripcion: string;
    orden: number;
    informe?: Informe; // Relación con Informe, opcional
   // secciones?: Seccion[]; // Relación con Secciones, opcional
  }
  