// src/app/service/matriz-grid.service.ts

import { Injectable } from '@angular/core';
import { ItemMatriz } from '../models/matriz';

export interface FactorView {
  sistema: string;
  subsistema: string;
  factor: string;
  componente: string;
  key: string;
}

export interface Stage {
  name: string;
  actions: string[];
}

export interface GridData {
  factors: FactorView[];
  stages: Stage[];
  valuationsMap: {
    [key: string]: {
      [stage: string]: {
        [action: string]: string;
      };
    };
  };
}

@Injectable({ providedIn: 'root' })
export class MatrizGridService {

  buildGrid(items: ItemMatriz[]): GridData {
    const factorMap: { [key: string]: FactorView } = {};
    const stages: Stage[] = [];
    const valuationsMap: GridData['valuationsMap'] = {};

    items.forEach(item => {
      const etapa       = item.etapa ?? 'N/A';
      const accionTipo  = item.accionTipo ?? 'N/A';
      const sistema     = item.factorSistema ?? 'N/A';
      const subsistema  = item.factorSubsistema ?? 'N/A';
      const factorTipo  = item.factorFactor ?? 'N/A';
      const componente  = item.factorComponente ?? 'N/A';
      const naturaleza  = item.naturaleza ?? 'N/A';
      const key         = `${sistema}|${subsistema}|${factorTipo}|${componente}`;

      // 1) Map de factores
      if (!factorMap[key]) {
        factorMap[key] = { sistema, subsistema, factor: factorTipo, componente, key };
      }

      // 2) Lista de etapas y sus acciones
      let stage = stages.find(s => s.name === etapa);
      if (!stage) {
        stage = { name: etapa, actions: [] };
        stages.push(stage);
      }
      if (!stage.actions.includes(accionTipo)) {
        stage.actions.push(accionTipo);
      }

      // 3) Mapa de valoraciones
      valuationsMap[key]          = valuationsMap[key]          || {};
      valuationsMap[key][etapa]  = valuationsMap[key][etapa]  || {};
      valuationsMap[key][etapa][accionTipo] = naturaleza;
    });

    // 4) Ordenar resultados
    const factors = Object.values(factorMap)
      .sort((a, b) => a.sistema.localeCompare(b.sistema));
    stages.sort((a, b) => a.name.localeCompare(b.name));

    return { factors, stages, valuationsMap };
  }
}
