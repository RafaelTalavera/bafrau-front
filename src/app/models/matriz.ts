export class Matriz {
  id!: number;
  fecha!: string;
  organizacion!: string;
  direccion!: string;
  rubro!: string;
  items!: ItemInforme[];
}

export class ItemInforme {
  id!: number;
  magnitude!: number;
  importance!: number;
  accionId?: number;
  factorId?: number;
  clasificacionFactor?: string;
  clasificacionAccion?: string;
}

export class Factor {
  id!: number;
  clasificacion!: string;
  tipo!: string;
}

export class Accion {
  id!: number;
  clasificacion!: string;
  tipo!: string;
}
