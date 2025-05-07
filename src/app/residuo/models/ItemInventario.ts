import { Inventario } from "./inventario";
import { Residuo } from "./residuo";

export class ItemInventario {
  // Aceptamos null inicialmente y en la creación
  id: number | null = null;
  inventario: Inventario | null = null;
  residuo: Residuo | null = null;

  constructor(init?: Partial<ItemInventario>) {
    Object.assign(this, init);
  }
}
