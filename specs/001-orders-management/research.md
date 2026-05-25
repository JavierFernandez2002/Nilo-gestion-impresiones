# Research: CU9 - Consultar estadisticas de produccion

## Decision: Modulo `statistics` de solo lectura

**Rationale**: Las metricas combinan `PrintJob`, `Printer` y `Order`. Un modulo dedicado evita cargar logica transversal en services de entidades y mantiene controllers/repositorios enfocados por caso de uso.

**Alternatives considered**:

- Agregar metodos estadisticos a cada service existente: rechazado porque la respuesta final coordina multiples entidades.
- Crear un servicio externo de reportes: fuera de alcance para metricas iniciales.

## Decision: Sin tablas nuevas ni snapshots

**Rationale**: Las metricas iniciales pueden calcularse desde estados y fechas existentes. Persistir snapshots agregaria migraciones, consistencia historica y tareas de actualizacion no solicitadas.

**Alternatives considered**:

- Tabla `ProductionStatisticsSnapshot`: rechazada porque CU9 no requiere historizacion ni performance precomputada.
- Campos derivados en entidades: rechazado porque duplicarian datos calculables.

## Decision: Agrupar por fechas de evento en UTC

**Rationale**: `finishedAt` y `cancelledAt` representan el momento operativo real. UTC evita ambiguedades iniciales y mantiene buckets deterministas en tests.

**Alternatives considered**:

- Usar `updatedAt`: rechazado porque una edicion posterior moveria metricas historicas.
- Agrupar por zona horaria configurable: fuera de alcance inicial.

## Decision: Semana en formato ISO `YYYY-Www`

**Rationale**: Las semanas ISO tienen inicio y numeracion estandar, y el formato es estable para ordenar y comparar.

**Alternatives considered**:

- Semana simple por numero de semana local: rechazado por ambiguedad de inicio de semana.
- Rango textual de fechas: rechazado para mantener contrato simple.

## Decision: Utilizacion opcional por estado actual

**Rationale**: La definicion inicial mas directa es porcentaje de impresoras activas que estan `IMPRIMIENDO` sobre todas las impresoras activas. No requiere historial de disponibilidad ni tiempos acumulados.

**Alternatives considered**:

- Utilizacion por horas imprimidas sobre horas disponibles: rechazada porque no existe historial suficiente ni tiempos reales.
- Incluir mantenimiento como no utilizable en denominador separado: rechazado por complejidad no pedida; se puede evolucionar luego.

## Decision: Pedidos opcionales por estado actual

**Rationale**: `LISTO_EN_TALLER` y `ENTREGADO` ya son estados de `Order` y permiten conteos simples sin modificar modelo.

**Alternatives considered**:

- Filtrar entregados por `deliveredAt` dentro del rango: rechazado para CU9 porque la metrica opcional solicitada es cantidad de pedidos por estado, no entregas por periodo.
