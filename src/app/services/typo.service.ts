// src/app/services/typo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Typo from 'typo-js';

@Injectable({ providedIn: 'root' })
export class TypoService {
  private dictionary!: any;

  constructor(private http: HttpClient) {}

  /** Inicializa el diccionario Hunspell */
  async init(): Promise<void> {
    if (this.dictionary) return;
    const [aff, dic] = await Promise.all([
      this.http.get('assets/typo/dictionaries/es_ES.aff', { responseType: 'text' }).toPromise(),
      this.http.get('assets/typo/dictionaries/es_ES.dic', { responseType: 'text' }).toPromise()
    ]);
    this.dictionary = new Typo('es_ES', aff, dic, {});
  }

  check(word: string): boolean {
    return this.dictionary.check(word);
  }

  suggest(word: string): string[] {
    return this.dictionary.suggest(word);
  }
}
