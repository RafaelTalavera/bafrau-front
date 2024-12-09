import { Informe } from "./informe.model";


export interface Procedimiento {
    id?: number;
    nombre: string;
    adjunto: string;
    informe?: Informe; // Informe relacionado, opcional ya que puede no estar presente siempre
  }