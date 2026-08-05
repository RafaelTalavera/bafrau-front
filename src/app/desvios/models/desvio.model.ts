export type EstadoDesvio = 'PRIMERA_OBSERVACION' | 'EN_PROCESO' | 'PERMANECE' | 'FINALIZADO';

export interface EvidenciaDesvio {
  id: number; url: string; nombreOriginal: string; tipoMime: string;
  tamano: number; descripcion?: string; autor: string; fechaCreacion: string;
}
export interface SeguimientoDesvio {
  id: number; fecha: string; comentario: string; estado: EstadoDesvio;
  porcentaje: number; autor: string; fechaCreacion: string; evidencias: EvidenciaDesvio[];
}
export interface DesvioListItem {
  id: number; numero: number; organizacionId: number; razonSocial: string;
  fechaDeteccion: string; sitioEstablecimiento: string; inspector: string;
  estado: EstadoDesvio; porcentaje: number; ultimaFechaSeguimiento?: string;
}
export interface DesvioDetalle extends DesvioListItem {
  descripcion: string; accionCorrectivaSugerida: string; responsablesReferentes?: string;
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
  PRIMERA_OBSERVACION: '1° observación', EN_PROCESO: 'En proceso',
  PERMANECE: 'Permanece', FINALIZADO: 'Finalizado'
};
