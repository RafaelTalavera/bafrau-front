// src/app/shared/pipes/filter-by-jurisdiccion.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';
import { Documento } from '../../legal/models/documento';

@Pipe({
  name: 'filterByJurisdiccion',
  standalone: true
})
export class FilterByJurisdiccionPipe implements PipeTransform {
  transform(documentos: Documento[] = [], jurisdiccion: string): Documento[] {
    if (!jurisdiccion) {
      return documentos;
    }
    return documentos.filter(doc => doc.juridiccion === jurisdiccion);
  }
}
