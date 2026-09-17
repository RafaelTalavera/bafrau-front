export type EstadoDesvio = 'PRIMERA_OBSERVACION' | 'EN_PROCESO' | 'PERMANECE' | 'FINALIZADO';
export type IndiceGravedadDesvio = 'MUY_LEVE' | 'LEVE' | 'MODERADO' | 'GRAVE' | 'CRITICO';
export type CondicionOperacionDesvio = 'NORMAL' | 'ANORMAL' | 'EMERGENCIA';

export interface EvidenciaDesvio {
  id: number; url: string; nombreOriginal: string; tipoMime: string;
  tamano: number; descripcion?: string; autor: string; fechaCreacion: string;
}
export interface SeguimientoDesvio {
  id: number; fecha: string; comentario: string; estado: EstadoDesvio;
  porcentaje: number; autor: string; fechaCreacion: string; evidencias: EvidenciaDesvio[];
  ediciones: SeguimientoEdicion[];
}
export interface SeguimientoEdicion {
  id: number; editor: string; fechaEdicion: string;
  fechaAnterior: string; fechaNueva: string;
  comentarioAnterior: string; comentarioNuevo: string;
  estadoAnterior: EstadoDesvio; estadoNuevo: EstadoDesvio;
  porcentajeAnterior: number; porcentajeNuevo: number;
}
export interface DesvioListItem {
  id: number; numero: number; organizacionId: number; razonSocial: string;
  fechaDeteccion: string; sitioEstablecimiento: string; inspector: string;
  indiceGravedad?: IndiceGravedadDesvio; condicionOperacion?: CondicionOperacionDesvio;
  estado: EstadoDesvio; porcentaje: number; ultimaFechaSeguimiento?: string;
  fechaCreacion: string;
}
export interface DesvioDetalle extends DesvioListItem {
  descripcion: string;
  accionInmediata?: string;
  responsableAccionInmediata?: string;
  fechaEjecucionAccionInmediata?: string;
  accionCorrectivaSugerida: string;
  responsableAccionCorrectiva?: string;
  fechaEjecucionAccionCorrectiva?: string;
  responsablesReferentes?: string;
  activo: boolean; fechaCreacion: string; fechaModificacion: string;
  evidencias: EvidenciaDesvio[]; seguimientos: SeguimientoDesvio[];
}
export interface PageResponse<T> {
  content: T[]; totalElements: number; totalPages: number; number: number; size: number;
}
export interface ResumenDesvios {
  total: number; primeraObservacion: number; enProceso: number; permanece: number; finalizados: number;
}
export const ESTADO_LABEL: Record<EstadoDesvio, string> = {
  PRIMERA_OBSERVACION: 'En avance', EN_PROCESO: 'En proceso',
  PERMANECE: 'Permanece', FINALIZADO: 'Finalizado'
};
export const INDICE_GRAVEDAD_LABEL: Record<IndiceGravedadDesvio, string> = {
  MUY_LEVE: '1 – Muy leve', LEVE: '2 – Leve', MODERADO: '3 – Moderado',
  GRAVE: '4 – Grave', CRITICO: '5 – Crítico'
};
export const CONDICION_OPERACION_LABEL: Record<CondicionOperacionDesvio, string> = {
  NORMAL: 'Normal', ANORMAL: 'Anormal', EMERGENCIA: 'Emergencia'
};

/** El avance se determina exclusivamente por el estado del desvío. */
export const ESTADO_PORCENTAJE: Record<EstadoDesvio, number> = {
  PERMANECE: 0,
  EN_PROCESO: 50,
  PRIMERA_OBSERVACION: 75,
  FINALIZADO: 100
};

export function porcentajeParaEstado(estado: EstadoDesvio): number {
  return ESTADO_PORCENTAJE[estado];
}
