export interface Option { label: string; value: number; }

export const AdditionalFieldOptions = {
  intensidadOptions: [
    { label: 'Baja', value: 1 },
    { label: 'Media', value: 2 },
    { label: 'Alta', value: 3 },
    { label: 'Muy alta', value: 8 },
    { label: 'Total', value: 12 }
  ] as Option[],

  extensionOptions: [
    { label: 'Puntual', value: 1 },
    { label: 'Parcial', value: 2 },
    { label: 'Extenso', value: 4 },
    { label: 'Total', value: 8 },
    { label: 'Crítica', value: 12 }
  ] as Option[],

  momentoOptions: [
    { label: 'Largo plazo', value: 1 },
    { label: 'Mediano plazo', value: 2 },
    { label: 'Inmediato', value: 4 },
    { label: 'Crítico', value: 8 }
  ] as Option[],

  persistenciaOptions: [
    { label: 'Fugaz', value: 1 },
    { label: 'Temporal', value: 2 },
    { label: 'Permanente', value: 4 }
  ] as Option[],

  reversibilidadOptions: [
    { label: 'Corto plazo', value: 1 },
    { label: 'Mediano plazo', value: 2 },
    { label: 'Irreversible', value: 4 }
  ] as Option[],

  sinergiaOptions: [
    { label: 'Sin sinergismo', value: 1 },
    { label: 'Sinérgico', value: 2 },
    { label: 'Muy sinérgico', value: 4 }
  ] as Option[],

  acumulacionOptions: [
    { label: 'Simple', value: 1 },
    { label: 'Acumulativo', value: 4 }
  ] as Option[],

  efectoOptions: [
    { label: 'Indirecto', value: 1 },
    { label: 'Directo', value: 4 }
  ] as Option[],

  periodicidadOptions: [
    { label: 'Irregular', value: 1 },
    { label: 'Periódico', value: 2 },
    { label: 'Continuo', value: 4 }
  ] as Option[],

  recuperacionOptions: [
    { label: 'Recuperable inmediato', value: 1 },
    { label: 'Recuperable a mediano plazo', value: 2 },
    { label: 'Mitigable', value: 4 },
    { label: 'Irrecuperable', value: 8 }
  ] as Option[],
};