
export class ItemMatriz {
  id!: number;
  fechaAlta?: string;
  organizacionId?: number;
  razonSocial?: string;
  etapa!: string;
  naturaleza?: string;
  intensidad?: number;
  extension?: number;
  momento?: number;
  persistencia?: number;
  reversivilidad?: number;
  sinergia?: number;
  acumulacion?: number;
  efecto?: number;
  periodicidad?: number;
  recuperacion?: number;
  uip?: number;
  accionId?: number;
  factorId!: number;
  matrizId?: number;         
  factorSistema!: string;
  factorSubsistema!: string;        
  factorFactor!: string;       
  factorComponente?: string;   
  accionTipo!: string;
  magnitude?: number;
  importance?: number;
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
