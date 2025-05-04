import { Informe } from "../../organizacion/models/organizacion.model";
import { Insumo } from "./insumo";

export interface Proceso {
    id?: number;
    nombre: string;
    producto: string;
    subProducto: string;
    residuos: string[]; 
    acopioResiduos: string;
    sitioResiduos: string;
    recipienteResiduos: string;
    residuosLiquidos: string;
    insumos: Insumo[]; 
    informe?: Informe; 
  }