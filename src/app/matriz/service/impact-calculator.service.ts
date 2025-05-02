// src/app/service/impact-calculator.service.ts
import { Injectable } from '@angular/core';
import { Stage, AdditionalFields } from './grid-builder.service';

@Injectable({ providedIn: 'root' })
export class ImpactCalculatorService {

  /** 1) Calcula el impacto según naturaleza y valores adicionales */
  calculateImpact(
    factorKey: string,
    a: AdditionalFields,
    naturaleza: string
  ): number {
    const sign = naturaleza.toLowerCase() === 'positivo' ? 1
               : naturaleza.toLowerCase() === 'negativo' ? -1
               : 0;
    return sign * (
      3 * a.intensidad +
      2 * a.extension +
      a.momento +
      a.persistencia +
      a.reversibilidad +
      a.sinergia +
      a.acumulacion +
      a.efecto +
      a.periodicidad +
      a.recuperacion
    );
  }

  /** 2) Importancia absoluta total para un factor */
  calculateImportanciaAbsolutaTotal(
    factorKey: string,
    valuationsMap: Record<string, Record<string, Record<string, string>>>,
    additionalMap: Record<string, Record<string, Record<string, AdditionalFields>>>,
    stages: Stage[]
  ): number {
    let total = 0;
    stages.forEach(st => {
      const actions = valuationsMap[factorKey]?.[st.name] ?? {};
      Object.entries(actions).forEach(([action, nat]) => {
        const a = additionalMap[factorKey][st.name][action];
        total += this.calculateImpact(factorKey, a, nat);
      });
    });
    return total;
  }

  /** 3) Importancia relativa total para un factor */
  calculateImportanciaRelativaTotalFactor(
    factorKey: string,
    valuationsMap: Record<string, Record<string, Record<string, string>>>,
    additionalMap: Record<string, Record<string, Record<string, AdditionalFields>>>,
    stages: Stage[]
  ): number {
    let sum = 0;
    stages.forEach(st => {
      const actions = valuationsMap[factorKey]?.[st.name] ?? {};
      Object.entries(actions).forEach(([action, nat]) => {
        const a = additionalMap[factorKey][st.name][action];
        const impact = this.calculateImpact(factorKey, a, nat);
        sum += impact * (a.uip / 1000);
      });
    });
    return sum;
  }

  /** 4) Cálculo genérico de IRT a partir de listas */
  calculateIRT(
    itemList: AdditionalFields[],
    impacts: number[]
  ): number {
    return itemList.reduce((acc, a, i) => acc + impacts[i] * (a.uip / 1000), 0);
  }

  /** Helper: obtiene o inicializa AdditionalFields */
  getAdditional(
    additionalMap: Record<string, Record<string, Record<string, AdditionalFields>>>,
    factorKey: string,
    stage: string,
    action: string
  ): AdditionalFields {
    additionalMap[factorKey] ||= {};
    additionalMap[factorKey][stage] ||= {};
    additionalMap[factorKey][stage][action] ||= {
      intensidad: 0, extension: 0, momento: 0,
      persistencia: 0, reversibilidad: 0,
      sinergia: 0, acumulacion: 0,
      efecto: 0, periodicidad: 0,
      recuperacion: 0, uip: 0
    };
    return additionalMap[factorKey][stage][action];
  }

  /** Helper: devuelve el primer UIP encontrado */
  getUIPValue(
    additionalMap: Record<string, Record<string, Record<string, AdditionalFields>>>,
    factorKey: string
  ): number {
    const vals = Object.values(additionalMap[factorKey] ?? {})
      .flatMap(m => Object.values(m).map(a => a.uip));
    return vals.length ? vals[0] : 0;
  }
}
