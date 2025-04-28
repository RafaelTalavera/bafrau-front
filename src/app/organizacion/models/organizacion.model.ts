import { Capitulo } from "../../models/capitulo";


export interface Organizacion {
    id?: number;
    fechaAlta:string;
    nombreDelProponente: string;
    tipoDeContrato: string;
    razonSocial: string;
    apoderadoLegal: string;
    apoderadoCargo: string;
    domicilioRealProyecto: string;
    domicilioLegalProyecto: string;
    situacionPredio: string;
    nomenclaturaCatatrasl: string;
    licenciaComercial: string;
    cuit: string;
    personeriaJuridica: string;
    fechaCreacion: Date;
    actividadPrincipal: string;
    dimensionPredio: string;
    superficieCubierta: string;
    superficieDescubierta: string;
    empleados?: any[];
    tecnologia: string;
    correos: any[];
    telefonos: any[];
    serviciosDisponibles: any[];
    procesos: any[];
    procedimientos:any[];
    adjuntoInformes: any[];
    capitulos: Capitulo[];
    sectores: any[];
    insumos:any[];
  }
  