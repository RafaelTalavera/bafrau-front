// src/app/residuo/models/inventario-payload.ts
export interface InventarioPayload {
  fecha: string;
  organizacionId: number;
  items: { residuo: { id: number } }[];
}