
import { Organizacion } from "../../organizacion/models/organizacion.model";
import { ItemInventario } from "./ItemInventario";

export class Inventario {
  id?: number;
  fecha!: string;              // LocalDate mapeado a ISO-8601 (yyyy-MM-dd)
  organizacionId!: number;  
  razonSocial!: string;
  items!: ItemInventario[];

  constructor(init?: Partial<Inventario>) {
    Object.assign(this, init);
  }
}
