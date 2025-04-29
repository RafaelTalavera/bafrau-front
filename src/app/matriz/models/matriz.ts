// src/app/models/matriz.ts
export class Accion {
  id!: number;
  clasificacion!: string;
  tipo!: string;
}

export class Factor {
  id!: number;
  medio!: string;
  factor!: string;
  componente!: string;
}

export class ItemMatriz {
  id!: number;
  fechaAlta!: string;
  organizacionId!: number;
  razonSocial!: string;
  etapa!: string;
  naturaleza!: string;
  intensidad!: number;
  extension!: number;
  momento!: number;
  persistencia!: number;
  reversibilidad!: number;
  sinergia!: number;
  acumulacion!: number;
  efecto!: number;
  periodicidad!: number;
  recuperacion!: number;
  uip!: number;
  accionId!: number;
  factorId!: number;
  matrizId!: number;           // Agregado para enviar el ID de la matriz
  factorMedio!: string;        // Agregado para mapear tu DTO Java
  factorFactor!: string;       // Agregado para mapear tu DTO Java
  factorComponente!: string;   // Agregado para mapear tu DTO Java
  accionTipo!: string;
  magnitude!: number;
  importance!: number;
}

export class Matriz {
  id!: number;
  fecha!: string;
  organizacionId!: number;
  razonSocial!: string;
  direccion!: string;
  rubro!: string;
  items!: ItemMatriz[];
  informe!: string;
}
