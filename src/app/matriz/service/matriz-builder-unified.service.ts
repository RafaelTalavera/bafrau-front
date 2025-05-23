// src/app/service/matriz-builder-unified.service.ts
import { Injectable } from '@angular/core';
import { ItemMatriz } from '../models/matriz';

export interface FactorView {
  id: number;
  sistema:     string;
  subsistema:  string;
  factor:      string;
  componente?: string;
}

export interface Stage {
  name:    string;
  actions: string[];
}

export interface AdditionalFields {
  intensidad:     number;
  extension:      number;
  momento:        number;
  persistencia:   number;
  reversibilidad: number;
  sinergia:       number;
  acumulacion:    number;
  efecto:         number;
  periodicidad:   number;
  recuperacion:   number;
  uip:            number;
}

@Injectable({ providedIn: 'root' })
export class MatrizBuilderUnifiedService {

  public buildGrid(items: ItemMatriz[]): {
    factors:        FactorView[];
    stages:         Stage[];
    valuationsMap:  Record<number, Record<string, Record<string, string>>>;
    additionalMap:  Record<number, Record<string, Record<string, AdditionalFields>>>;
  } {
    // 1) Factores únicos por factorId
    const factorsMap: Record<number, FactorView> = {};
    items.forEach(item => {
      if (!factorsMap[item.factorId]) {
        factorsMap[item.factorId] = {
          id:         item.factorId,
          sistema:    item.factorSistema,
          subsistema: item.factorSubsistema,
          factor:     item.factorFactor,
          componente: item.factorComponente
        };
      }
    });
    const factors = Object.values(factorsMap);

    // **ORDENAR según prioridad de subsistema**
    const prioridadSubs = [
      'Medio Inerte',
      'Medio Biótico',
      'Medio Perceptual',
      'Medio Socioeconómico'
    ];
    factors.sort((a, b) => {
      // 1) Sistema
      const cmpSistema = a.sistema.localeCompare(b.sistema);
      if (cmpSistema !== 0) return cmpSistema;
      // 2) Subsistema según prioridad
      const ia = prioridadSubs.indexOf(a.subsistema);
      const ib = prioridadSubs.indexOf(b.subsistema);
      if (ia !== ib) return ia - ib;
      // 3) Factor y componente
      const cmpFactor = a.factor.localeCompare(b.factor);
      if (cmpFactor !== 0) return cmpFactor;
      return (a.componente ?? '').localeCompare(b.componente ?? '');
    });

    // 2) Etapas y acciones
    const stagesMap: Record<string, Set<string>> = {};
    items.forEach(item => {
      stagesMap[item.etapa] ||= new Set();
      stagesMap[item.etapa].add(item.accionTipo);
    });
    const stages: Stage[] = Object
      .entries(stagesMap)
      .map(([name, set]) => ({ name, actions: Array.from(set) }));

    // 3) Mapa de naturalezas
    const valuationsMap: Record<number, Record<string, Record<string, string>>> = {};
    items.forEach(item => {
      const fid = item.factorId;
      valuationsMap[fid] ||= {};
      valuationsMap[fid][item.etapa] ||= {};
      valuationsMap[fid][item.etapa][item.accionTipo] = item.naturaleza || '';
    });

    // 4) Mapa de campos adicionales
    const additionalMap: Record<number, Record<string, Record<string, AdditionalFields>>> = {};
    items.forEach(item => {
      const fid = item.factorId;
      additionalMap[fid] ||= {};
      additionalMap[fid][item.etapa] ||= {};
      additionalMap[fid][item.etapa][item.accionTipo] = {
        intensidad:     item.intensidad    ?? 0,
        extension:      item.extension     ?? 0,
        momento:        item.momento       ?? 0,
        persistencia:   item.persistencia  ?? 0,
        reversibilidad: item.reversivilidad?? 0,  // JSON usa "reversivilidad"
        sinergia:       item.sinergia      ?? 0,
        acumulacion:    item.acumulacion   ?? 0,
        efecto:         item.efecto        ?? 0,
        periodicidad:   item.periodicidad  ?? 0,
        recuperacion:   item.recuperacion  ?? 0,
        uip:            item.uip           ?? 0,
      };
    });

    return { factors, stages, valuationsMap, additionalMap };
  }
}
