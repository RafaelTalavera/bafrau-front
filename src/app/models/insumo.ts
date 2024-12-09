import { Proceso } from "./proceso";



export interface Insumo {
    id?: number;
    nombre: string;
    fichaTenica: string;
    proceso?: Proceso; // El proceso relacionado, opcional
  }
  