# UIP en nuevas combinaciones de matriz

## Incidente

En la matriz de impacto de **Taraborelli Patagonia S.A.**, fecha
**2026-02-16** (matriz 18), los IRT de la etapa Construcción se mostraban en
cero para Medio Físico y Medio Socioeconómico pese a que los impactos tenían
valores.

La fórmula de IRT no era la causa:

```text
IRT = suma(impacto * UIP / 1000)
```

Los 70 ítems de Construcción tenían `uip = 0`. Por ello, el resultado era
correctamente cero. Antes de corregir los datos, los IAT eran -157 para Medio
Físico y 85 para Medio Socioeconómico, mientras que ambos IRT eran 0.

## Causa

Al guardar una matriz desde `MatrizCausaEfectoV1Component`, una combinación
nueva de factor, etapa y acción no posee un ítem original. El objeto enviado
al backend se construía sin `uip`; el backend lo persistía con el valor por
defecto `0`.

Esto puede ocurrir, por ejemplo, al agregar una etapa o una acción después de
haber ponderado los factores.

## Prevención implementada

Al construir un ítem nuevo, el frontend ahora busca un ítem existente del
mismo `factorId` y copia su UIP. El UIP representa la ponderación del factor,
por lo que debe ser igual en todas sus etapas y acciones.

Si el ítem ya existía, se conserva su propio UIP. Si no existe un valor previo
para el factor, se conserva el valor inicial 0 para que la matriz pueda ser
ponderada explícitamente.

## Corrección de datos aplicada

Se usó el endpoint existente `PUT /api/matrices/{id}/uip` para volver a aplicar
la distribución vigente de los 14 factores de la matriz 18. La distribución
suma 1.000 y el backend la propaga a todos los ítems de cada factor.

Luego de la corrección, los resultados de Construcción fueron:

| Sistema | IRT |
| --- | ---: |
| Medio Físico | -10,4 |
| Medio Socioeconómico | 5,9 |

No se modificó código de backend.
