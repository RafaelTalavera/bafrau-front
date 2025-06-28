
export interface InventarioPayload {
  fecha: string;
  organizacionId: number;
  contrato: string;
  items: { residuo: { id: number } }[];
}