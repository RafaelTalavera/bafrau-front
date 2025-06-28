import { Organizacion } from "../../../organizacion/models/organizacion.model";


export interface Capitulo {
    id?: number;
    titulo: string;
    descripcion: string;
    orden: number;
    organizacion?: Organizacion; // Relación con Informe, opcional
   // secciones?: Seccion[]; // Relación con Secciones, opcional
  }
  