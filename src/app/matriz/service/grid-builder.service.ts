// src/app/service/grid-builder.service.ts
import { Injectable } from '@angular/core';
import { ItemMatriz } from '../models/matriz';

export interface Stage {
  name: string;
  actions: string[];
}

export interface FactorView {
  factorSistema: string;
  factorSubsistema: string;
  factorComponente?: string;
  factorFactor: string;
  key: string;
}

export interface AdditionalFields {
  intensidad: number;
  extension: number;
  momento: number;
  persistencia: number;
  reversibilidad: number;
  sinergia: number;
  acumulacion: number;
  efecto: number;
  periodicidad: number;
  recuperacion: number;
  uip: number;
}

@Injectable({ providedIn: 'root' })
export class GridBuilderService {

  /** 1) Mapea cada ítem a su FactorView único */
  buildFactorMap(items: ItemMatriz[]): Record<string, FactorView> {
    const factorMap: Record<string, FactorView> = {};
    items.forEach(item => {
      if (!item.factorSistema || !item.factorSubsistema || !item.factorFactor) return;
      const key = [
        item.factorSistema,
        item.factorSubsistema,
        item.factorComponente ?? '',
        item.factorFactor
      ].join('|');
      if (!factorMap[key]) {
        factorMap[key] = {
          factorSistema: item.factorSistema,
          factorSubsistema: item.factorSubsistema,
          factorComponente: item.factorComponente,
          factorFactor: item.factorFactor,
          key
        };
      }
    });
    return factorMap;
  }

  /** 2) Extrae las etapas únicas y sus acciones asociadas */
  extractStages(items: ItemMatriz[]): Stage[] {
    const map: Record<string, Stage> = {};
    items.forEach(item => {
      if (!item.etapa) return;
      if (!map[item.etapa]) {
        map[item.etapa] = { name: item.etapa, actions: [] };
      }
      if (item.accionTipo && !map[item.etapa].actions.includes(item.accionTipo)) {
        map[item.etapa].actions.push(item.accionTipo);
      }
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }

  /** 3) Construye el mapa de naturalezas [factorKey][etapa][acción] */
  buildValuationsMap(items: ItemMatriz[]): Record<string, Record<string, Record<string, string>>> {
    const valuations: Record<string, Record<string, Record<string, string>>> = {};
    items.forEach(item => {
      const key = this.factorKey(item);
      valuations[key] ||= {};
      valuations[key][item.etapa] ||= {};
      valuations[key][item.etapa][item.accionTipo] = item.naturaleza ?? '';
    });
    return valuations;
  }

  /** 4) Construye el mapa de valores adicionales [factorKey][etapa][acción] */
  buildAdditionalMap(items: ItemMatriz[]): Record<string, Record<string, Record<string, AdditionalFields>>> {
    const additional: Record<string, Record<string, Record<string, AdditionalFields>>> = {};
    items.forEach(item => {
      const key = this.factorKey(item);
      additional[key] ||= {};
      additional[key][item.etapa] ||= {};
      additional[key][item.etapa][item.accionTipo] = {
        intensidad:       item.intensidad    ?? 0,
        extension:        item.extension     ?? 0,
        momento:          item.momento       ?? 0,
        persistencia:     item.persistencia  ?? 0,
        reversibilidad:   item.reversibilidad?? 0,
        sinergia:         item.sinergia      ?? 0,
        acumulacion:      item.acumulacion   ?? 0,
        efecto:           item.efecto        ?? 0,
        periodicidad:     item.periodicidad  ?? 0,
        recuperacion:     item.recuperacion  ?? 0,
        uip:              item.uip           ?? 0,
      };
    });
    return additional;
  }

  /** Helper para generar la key consistente */
  private factorKey(item: ItemMatriz): string {
    return [
      item.factorSistema,
      item.factorSubsistema,
      item.factorComponente ?? '',
      item.factorFactor
    ].join('|');
  }
}
