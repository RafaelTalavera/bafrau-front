// src/app/models/tabla-dto.model.ts

export interface CeldaDTO {
  id: number;
  numeroColumna: number;
  contenido: string;
  filaId: number;
}

export interface FilaDTO {
  id: number;
  numeroFila: number;
  tablaId: number;
  celdas: CeldaDTO[];
}

export interface TablaDTO {
  id: number;
  nombre: string;
  seccionId: number;
  filas: FilaDTO[];
}
