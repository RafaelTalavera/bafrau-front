
import { ItemInventario } from "./ItemInventario";

export class Inventario {
  id?: number;
  fecha!: string;             
  organizacionId!: number;  
  razonSocial!: string;
  contrato!:string;
  items!: ItemInventario[];

  constructor(init?: Partial<Inventario>) {
    Object.assign(this, init);
  }
}
