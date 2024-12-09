import { AdjuntoInforme } from "./adjuntoInforme";
import { Capitulo } from "./capitulo";
import { Correo } from "./correo";
import { Procedimiento } from "./procedimiento";
import { Proceso } from "./proceso";
import { Sector } from "./sector";
import { ServicioDisponible } from "./servicio.disponible";
import { Telefono } from "./telefono";

export interface Informe {
    id?: number;
    nombreDelProponente: string;
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
  



  










