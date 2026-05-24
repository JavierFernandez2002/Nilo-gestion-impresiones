# Especificación inicial — Nilo Gestión de Impresiones

## 0. Visión general

**Nilo Gestión de Impresiones** es un sistema web interno para administrar la producción de una granja de impresoras 3D. Su objetivo es centralizar la gestión de pedidos, impresiones e impresoras, permitiendo asignar trabajos manual o automáticamente, controlar estados de producción, detectar máquinas en mantenimiento y consultar métricas operativas.

El sistema debe poder utilizarse desde cualquier dispositivo conectado a la red local de la fábrica.

---

# 1. Problema que resuelve

Actualmente, la gestión de impresiones 3D requiere coordinar manualmente:

- qué pedidos están pendientes;
- qué piezas o impresiones componen cada pedido;
- qué impresoras están disponibles;
- qué máquinas están imprimiendo;
- cuáles están en mantenimiento;
- qué impresiones fueron canceladas;
- cuánto avance tiene cada pedido;
- qué volumen de producción se realizó por día, semana o mes.

Esto puede generar:

- pérdida de trazabilidad;
- asignaciones duplicadas o incorrectas;
- máquinas ociosas sin detectar;
- pedidos demorados;
- dificultad para saber qué está listo para entregar;
- falta de datos para medir productividad.

El sistema busca resolver esto mediante una fuente única de información para la operación diaria de la granja de impresoras.

---

# 2. Usuarios principales

## Usuario operador

Persona que trabaja en la fábrica y gestiona el día a día de las impresiones.

Puede:

- crear y actualizar pedidos;
- cargar impresiones;
- asignar impresiones a impresoras;
- marcar impresiones como corriendo o canceladas;
- ver el estado de las impresoras;
- consultar el progreso de pedidos.

## Usuario administrador

Responsable de controlar la operación general.

Puede hacer todo lo del operador y además:

- gestionar la flota de impresoras;
- marcar impresoras en mantenimiento;
- consultar estadísticas de producción;
- revisar métricas de cancelaciones y disponibilidad.

## Usuario de consulta, opcional

Perfil que solo puede visualizar información.

Podría servir para alguien de ventas, atención al cliente o logística que necesita saber si un pedido está listo, pero no debería modificar datos.

---

# 3. Casos de uso

## CU1 — Gestionar impresoras

El usuario puede crear, ver, editar y eliminar impresoras.

Cada impresora debe tener al menos:

- nombre o identificador;
- estado;
- información opcional de ubicación o modelo;
- estado operativo actual.

Estados posibles:

- `LISTA`;
- `IMPRIMIENDO`;
- `MANTENIMIENTO`.

Ejemplo:

> El administrador registra una nueva Ender 3 V3 SE como “Impresora 07” y la deja en estado `LISTA`.

---

## CU2 — Gestionar pedidos

El usuario puede crear, ver, editar y eliminar pedidos.

Cada pedido puede tener una o varias impresiones asociadas.

Estados posibles del pedido:

- `PENDIENTE`;
- `INCOMPLETO`;
- `LISTO_EN_TALLER`;
- `ENTREGADO`.

El pedido debe mostrar su porcentaje de progreso según el estado de sus impresiones.

Ejemplo:

> Un pedido tiene 10 impresiones. Si 6 ya finalizaron, el progreso es 60%.

---

## CU3 — Gestionar impresiones

El usuario puede crear, ver, editar y eliminar impresiones.

Cada impresión representa una pieza, modelo o trabajo individual que debe ser impreso.

Estados posibles:

- `PENDIENTE`;
- `CORRIENDO`;
- `CANCELADA`;
- posiblemente `FINALIZADA`, aunque no aparece en tus requisitos y convendría agregarlo.

Acá hay una ambigüedad importante: para calcular progreso y saber si un pedido está listo, hace falta algún estado equivalente a **finalizada/completada**.

---

## CU4 — Asignar impresión manualmente

El usuario puede seleccionar una impresión pendiente y asignarla a una impresora disponible.

Condiciones:

- la impresión debe estar `PENDIENTE`;
- la impresora debe estar `LISTA`;
- al asignarse, la impresión pasa a `CORRIENDO`;
- la impresora pasa a `IMPRIMIENDO`.
- se asigna una impresión por vez.

Ejemplo:

> El operador asigna la impresión “Pieza soporte A” a la “Impresora 03”. La impresión queda corriendo y la impresora deja de estar disponible.

---

## CU5 — Marcar una impresión como cancelada

El usuario puede cancelar una impresión.

Condiciones:

- una impresión pendiente puede cancelarse;
- una impresión corriendo también puede cancelarse;
- si estaba asignada a una impresora, la impresora debería volver a `LISTA` o pasar a otro estado según lo que se defina.

Ejemplo:

> Una pieza falla durante la impresión. El operador cancela la impresión y libera la máquina para otro trabajo.

---

## CU6 — Finalizar una impresión

Caso de uso sugerido, aunque no estaba explícito.

El usuario puede marcar una impresión corriendo como finalizada.

Condiciones:

- la impresión debe estar `CORRIENDO`;
- al finalizar, la impresora asociada vuelve a `LISTA`;
- el pedido recalcula su progreso;
- si todas las impresiones válidas del pedido están finalizadas, el pedido puede pasar a `LISTO_EN_TALLER`.

---

## CU7 — Asignación automática de impresiones

El usuario puede solicitar que el sistema asigne impresiones pendientes a impresoras disponibles según una estrategia.

Estrategias iniciales:

### Automático

Asigna impresiones pendientes en el orden definido por los pedidos.

Ejemplo:

> Si hay 5 impresoras libres y 20 impresiones pendientes, toma las primeras 5 impresiones pendientes y las asigna a las 5 impresoras disponibles.

### Por duración

Asigna impresiones cuya duración estimada coincida con una cantidad de horas definida por el usuario.

Ejemplo:

> El usuario pide asignar impresiones de hasta 4 horas. El sistema busca impresiones pendientes con duración estimada menor o igual a 4 horas.

### Por largo de pedido

Asigna impresiones pertenecientes a pedidos con una cantidad mínima o máxima de impresiones.

Ejemplo:

> El usuario quiere priorizar pedidos chicos. El sistema selecciona pedidos con máximo 3 impresiones pendientes.

---

## CU8 — Gestionar mantenimiento de impresoras

El usuario puede marcar una impresora como en mantenimiento.

Condiciones:

- una impresora en mantenimiento no puede recibir nuevas impresiones;
- si una impresora está imprimiendo, debería definirse si se permite pasarla a mantenimiento directamente o si primero debe cancelarse/finalizarse la impresión actual.

Ejemplo:

> La impresora 04 tiene problemas de extrusión. El administrador la marca como `MANTENIMIENTO`.

---

## CU9 — Consultar estadísticas de producción

El usuario puede ver métricas generales.

Estadísticas iniciales:

- cantidad de impresiones finalizadas por día;
- cantidad de impresiones finalizadas por semana;
- cantidad de impresiones finalizadas por mes;
- cantidad de máquinas en mantenimiento;
- cantidad de impresiones canceladas;
- porcentaje de utilización de impresoras, opcional;
- cantidad de pedidos listos y entregados, opcional.

---

# 4. Reglas de negocio

## Reglas sobre impresoras

1. Una impresora puede estar en uno solo de estos estados:
    - `LISTA`;
    - `IMPRIMIENDO`;
    - `MANTENIMIENTO`.
2. Una impresora en estado `MANTENIMIENTO` no puede recibir impresiones.
3. Una impresora en estado `IMPRIMIENDO` no puede recibir otra impresión al mismo tiempo.
4. Una impresora en estado `LISTA` puede recibir una impresión pendiente.
5. Cuando una impresión se asigna a una impresora, la impresora pasa a `IMPRIMIENDO`.
6. Cuando una impresión asignada finaliza o se cancela, la impresora asociada debería volver a `LISTA`, salvo que se indique mantenimiento.

---

## Reglas sobre impresiones

1. Una impresión puede estar en uno de estos estados:
    - `PENDIENTE`;
    - `CORRIENDO`;
    - `CANCELADA`;
    - `FINALIZADA`, sugerido.
2. Solo una impresión `PENDIENTE` puede pasar a `CORRIENDO`.
3. Solo una impresión `CORRIENDO` debería tener una impresora asignada.
4. Una impresión `CANCELADA` no debe ser asignada automáticamente.
5. Una impresión `FINALIZADA` no debe poder volver a `PENDIENTE`, salvo acción administrativa explícita.
6. Una impresión debe pertenecer a un pedido, salvo que se permita crear impresiones sueltas. Esto conviene definirlo.

---

## Reglas sobre pedidos

1. Un pedido puede tener una o muchas impresiones.
2. El progreso de un pedido se calcula en base a sus impresiones.
3. Fórmula sugerida:

```
progreso = impresiones_finalizadas / impresiones_totales_no_canceladas * 100
```

4. Si todas las impresiones están pendientes, el pedido está `PENDIENTE`.
5. Si al menos una impresión está corriendo o finalizada, pero no todas están finalizadas, el pedido está `INCOMPLETO`.
6. Si todas las impresiones no canceladas están finalizadas, el pedido pasa a `LISTO_EN_TALLER`.
7. Un pedido solo puede pasar a `ENTREGADO` si antes está `LISTO_EN_TALLER`.
8. Si todas las impresiones de un pedido fueron canceladas, hay que definir si el pedido queda `CANCELADO`, `INCOMPLETO` o requiere intervención manual.

---

## Reglas sobre asignación automática

1. La asignación automática solo considera impresiones `PENDIENTE`.
2. La asignación automática solo considera impresoras `LISTA`.
3. La cantidad máxima de asignaciones automáticas está limitada por la cantidad de impresoras disponibles.
4. La estrategia automática debe respetar el orden de prioridad definido.
5. Si no hay impresoras disponibles, no se asigna ninguna impresión.
6. Si no hay impresiones que cumplan los filtros, no se asigna ninguna impresión.
7. Una impresión no puede ser asignada a más de una impresora.
8. Una impresora no puede recibir más de una impresión en la misma ejecución de autocompletado.

---

# 5. Entidades principales

## Usuario

Representa a quien usa el sistema.

Campos posibles:

```
id
nombre
email
rol
activo
fechaCreacion
```

Roles posibles:

```
ADMIN
OPERADOR
LECTURA
```

---

## Impresora

Representa una máquina de la granja.

Campos posibles:

```
id
nombre
codigo
modelo
ubicacion
estado
wifiIp
activa
fechaCreacion
fechaUltimaActualizacion
```

Estados:

```
LISTA
IMPRIMIENDO
MANTENIMIENTO
```

---

## Pedido

Representa un pedido de cliente o una orden interna de producción.

Campos posibles:

```
id
codigoPedido
cliente
estado
porcentajeProgreso
fechaCreacion
fechaEntregaEstimada
fechaEntregadoobservaciones
```

Estados:

```
PENDIENTE
INCOMPLETO
LISTO_EN_TALLER
ENTREGADO
```

Posible estado adicional:

```
CANCELADO
```

---

## Impresion

Representa una pieza o trabajo individual.

Campos posibles:

```
id
pedidoId
impresoraId
nombreModelo
codigoModelo
materialcolor
duracionEstimadaHoras
estado
fechaCreacion
fechaInicio
fechaFin
observaciones
```

Estados:

```
PENDIENTE
CORRIENDO
FINALIZADA
CANCELADA
```

---

## AsignacionImpresion

Entidad opcional, útil si querés trazabilidad histórica.

Representa el historial de qué impresión se asignó a qué impresora.

Campos posibles:

```
id
impresionId
impresoraId
fechaAsignacion
fechaInicio
fechaFinestadoResultado
tipoAsignacionusuarioId
```

Tipos de asignación:

```
MANUAL
AUTOMATICA
POR_DURACION
POR_LARGO_PEDIDO
```

Esta entidad es recomendable si querés auditar qué pasó, cuándo y quién lo hizo.

---

## Mantenimiento

Entidad opcional, útil si querés registrar historial de mantenimiento.

Campos posibles:

```
id
impresora
IdfechaInicio
fechaFinmotivo
descripcion
estado
usuarioResponsableId
```

Estados:

```
ABIERTO
CERRADO
```

---

# 6. Casos borde

## Impresora en mantenimiento recibe asignación

El sistema debe rechazar la operación.

**Resultado esperado:**

> No se puede asignar una impresión a una impresora en mantenimiento.

---

## Impresora ya está imprimiendo

El sistema debe rechazar una nueva asignación.

**Resultado esperado:**

> La impresora ya tiene una impresión en curso.

---

## Impresión cancelada intenta asignarse

El sistema debe rechazar la operación.

**Resultado esperado:**

> No se puede asignar una impresión cancelada.

---

## Impresión ya está corriendo

El sistema no debe permitir asignarla a otra impresora.

**Resultado esperado:**

> La impresión ya se encuentra asignada a una impresora.

---

## Pedido sin impresiones

Hay que definir si se permite.

Opciones:

1. No permitir crear pedidos sin impresiones.
2. Permitirlos, pero con progreso 0%.
3. Permitirlos como borrador.

Recomendación inicial:

> Permitir pedido sin impresiones solo si existe estado `BORRADOR`. Si no, exigir al menos una impresión.

---

## Todas las impresiones del pedido están canceladas

Hay que definir cómo impacta en el estado del pedido.

Opciones:

- pedido `CANCELADO`;
- pedido `INCOMPLETO`;
- pedido queda pendiente de revisión manual.

Recomendación:

> Agregar estado `CANCELADO` para pedidos.

---

## Se elimina una impresora con impresiones históricas

No conviene eliminar físicamente una impresora si ya tuvo impresiones asociadas.

Recomendación:

> Usar baja lógica con campo `activa = false`.

---

## Se elimina un pedido con impresiones asociadas

Puede romper trazabilidad.

Recomendación:

> No eliminar pedidos con actividad. Usar cancelación o baja lógica.

---

## Se cae la conexión local

Como el sistema se usa en red local, hay que pensar qué pasa si:

- el servidor local se apaga;
- un dispositivo pierde conexión;
- dos usuarios intentan asignar la misma impresora al mismo tiempo.

Recomendación:

> Manejar concurrencia para evitar doble asignación.

---

## Dos usuarios ejecutan autocompletado al mismo tiempo

Puede ocurrir que ambos intenten asignar las mismas impresoras.

El sistema debe garantizar que:

- una impresión no quede asignada dos veces;
- una impresora no reciba dos trabajos simultáneos.

---

## Duración estimada vacía

Si se usa filtro por duración, hay que definir qué hacer con impresiones sin duración cargada.

Opciones:

- excluirlas del autocompletado por duración;
- incluirlas al final;
- exigir duración obligatoria.

Recomendación:

> Para usar autocompletado por duración, la impresión debe tener duración estimada.

---

# 7. Criterios de aceptación

Estos criterios son útiles para validar el comportamiento antes de codear.

## Gestión de impresoras

### CA1 — Crear impresora

**Dado** un usuario administrador  
**Cuando** carga una impresora con nombre válido  
**Entonces** el sistema crea la impresora en estado `LISTA`.

---

### CA2 — Marcar impresora en mantenimiento

**Dado** una impresora en estado `LISTA`  
**Cuando** el usuario la marca como `MANTENIMIENTO`  
**Entonces** la impresora deja de estar disponible para asignaciones.

---

### CA3 — Impedir asignación a impresora en mantenimiento

**Dado** una impresora en estado `MANTENIMIENTO`  
**Cuando** el usuario intenta asignarle una impresión  
**Entonces** el sistema rechaza la operación.

---

## Gestión de impresiones

### CA4 — Crear impresión pendiente

**Dado** un pedido existente  
**Cuando** el usuario crea una impresión asociada al pedido  
**Entonces** la impresión queda en estado `PENDIENTE`.

---

### CA5 — Asignar impresión manualmente

**Dado** una impresión `PENDIENTE`  
**Y** una impresora `LISTA`  
**Cuando** el usuario asigna la impresión a la impresora  
**Entonces** la impresión pasa a `CORRIENDO`  
**Y** la impresora pasa a `IMPRIMIENDO`.

---

### CA6 — Cancelar impresión corriendo

**Dado** una impresión `CORRIENDO` asignada a una impresora  
**Cuando** el usuario cancela la impresión  
**Entonces** la impresión pasa a `CANCELADA`  
**Y** la impresora vuelve a `LISTA`.

---

### CA7 — Finalizar impresión

**Dado** una impresión `CORRIENDO`  
**Cuando** el usuario la marca como finalizada  
**Entonces** la impresión pasa a `FINALIZADA`  
**Y** la impresora vuelve a `LISTA`  
**Y** el progreso del pedido se recalcula.

---

## Gestión de pedidos

### CA8 — Calcular progreso de pedido

**Dado** un pedido con 10 impresiones no canceladas  
**Y** 4 impresiones finalizadas  
**Cuando** el usuario consulta el pedido  
**Entonces** el progreso mostrado es 40%.

---

### CA9 — Pedido listo en taller

**Dado** un pedido con todas sus impresiones no canceladas finalizadas  
**Cuando** el sistema recalcula el estado  
**Entonces** el pedido queda en estado `LISTO_EN_TALLER`.

---

### CA10 — Entregar pedido

**Dado** un pedido en estado `LISTO_EN_TALLER`  
**Cuando** el usuario lo marca como entregado  
**Entonces** el pedido pasa a estado `ENTREGADO`.

---

## Asignación automática

### CA11 — Autocompletado automático

**Dado** 3 impresoras en estado `LISTA`  
**Y** 10 impresiones pendientes  
**Cuando** el usuario ejecuta autocompletado automático  
**Entonces** el sistema asigna como máximo 3 impresiones  
**Y** cada impresora recibe una única impresión.

---

### CA12 — Autocompletado por duración

**Dado** impresiones pendientes con distintas duraciones estimadas  
**Cuando** el usuario solicita asignar impresiones de hasta 4 horas  
**Entonces** el sistema solo selecciona impresiones con duración estimada menor o igual a 4 horas.

---

### CA13 — Autocompletado por largo de pedido

**Dado** pedidos con diferente cantidad de impresiones pendientes  
**Cuando** el usuario solicita priorizar pedidos con máximo 3 impresiones  
**Entonces** el sistema selecciona impresiones pertenecientes a pedidos que cumplen esa condición.

---

## Estadísticas

### CA14 — Consultar cantidad impresa por día

**Dado** impresiones finalizadas en una fecha determinada  
**Cuando** el usuario consulta estadísticas diarias  
**Entonces** el sistema muestra la cantidad de impresiones finalizadas ese día.

---

### CA15 — Consultar máquinas en mantenimiento

**Dado** impresoras marcadas como `MANTENIMIENTO`  
**Cuando** el usuario consulta estadísticas  
**Entonces** el sistema muestra la cantidad actual de impresoras en mantenimiento.

---

# 8. Posibles endpoints REST

## Impresoras

```
GET /api/impresoras
GET /api/impresoras/{id}
POST /api/impresoras
PUT /api/impresoras/{id}
PATCH /api/impresoras/{id}/estado
DELETE /api/impresoras/{id}
```

Ejemplos de acciones específicas:

```
PATCH /api/impresoras/{id}/mantenimiento
PATCH /api/impresoras/{id}/lista
```

---

## Pedidos

```
GET /api/pedidos
GET /api/pedidos/{id}
POST /api/pedidosPUT /api/pedidos/{id}
DELETE /api/pedidos/{id}
```

Acciones específicas:

```
PATCH /api/pedidos/{id}/entregar
PATCH /api/pedidos/{id}/recalcular-progreso
GET /api/pedidos/{id}/impresiones
```

Filtros posibles:

```
GET /api/pedidos?estado=PENDIENTE
GET /api/pedidos?estado=LISTO_EN_TALLER
GET /api/pedidos?cliente=Juan
```

---

## Impresiones

```
GET /api/impresiones
GET /api/impresiones/{id}
POST /api/impresiones
PUT /api/impresiones/{id}
DELETE /api/impresiones/{id}
```

Acciones específicas:

```
PATCH /api/impresiones/{id}/asignar
PATCH /api/impresiones/{id}/cancelar
PATCH /api/impresiones/{id}/finalizar
```

Filtros posibles:

```
GET /api/impresiones?estado=PENDIENTE
GET /api/impresiones?estado=CORRIENDO
GET /api/impresiones?pedidoId=123
GET /api/impresiones?duracionMaximaHoras=4
```

---

## Asignación automática

```
POST /api/asignaciones/automaticas
```

Body posible:

```
{  "estrategia": "AUTOMATICO"}
```

```
{  "estrategia": "POR_DURACION",  "duracionMaximaHoras": 4}
```

```
{  "estrategia": "POR_LARGO_PEDIDO",  "criterio": "MAXIMO",  "cantidadImpresiones": 3}
```

También se podría separar por endpoints:

```
POST /api/asignaciones/automaticas/orden
POST /api/asignaciones/automaticas/duracion
POST /api/asignaciones/automaticas/largo-pedido
```

Pero recomiendo un solo endpoint con estrategia, porque escala mejor.

---

## Estadísticas

```
GET /api/estadisticas/produccion/diaria
GET /api/estadisticas/produccion/semanal
GET /api/estadisticas/produccion/mensual
GET /api/estadisticas/impresoras/mantenimiento
GET /api/estadisticas/impresiones/canceladas
```

Endpoint más flexible:

```
GET /api/estadisticas/produccion?desde=2026-05-01&hasta=2026-05-19&agrupadoPor=DIA
```

---

## Usuarios, si hay autenticación

```
GET /api/usuarios
POST /api/usuarios
PUT /api/usuarios/{id}
PATCH /api/usuarios/{id}/desactivar
```

Autenticación:

```
POST /api/auth/loginPOST /api/auth/logoutGET /api/auth/me
```
# Especificación base recomendada para MVP

Para una primera versión, yo cerraría el alcance así:

## Incluido en MVP

- CRUD de impresoras.
- CRUD de pedidos.
- CRUD de impresiones.
- Estados de impresoras.
- Estados de impresiones incluyendo `FINALIZADA`.
- Estados de pedidos.
- Asignación manual.
- Asignación automática simple.
- Filtro automático por duración.
- Filtro automático por largo de pedido.
- Estadísticas básicas.
- Uso desde red local.
- Roles simples.

## No incluido todavía

- Integración real con impresoras WiFi.
- Control remoto de impresión.
- Carga automática de archivos STL.
- Slicing automático.
- Optimización de cama.
- Tandas con múltiples piezas por impresora.
- Notificaciones.
- App Mobile nativa.
# Versión resumida tipo contrato SDD

```
El sistema Nilo Gestión de Impresiones permite administrar pedidos, impresiones e impresoras de una granja de impresión 3D desde una aplicación web accesible en la red local.Los usuarios pueden crear pedidos, cargar impresiones asociadas, administrar impresoras y asignar trabajos de impresión de forma manual o automática.Una impresora puede estar lista, imprimiendo o en mantenimiento. Solo las impresoras listas pueden recibir nuevas impresiones.Una impresión puede estar pendiente, corriendo, finalizada o cancelada. Solo las impresiones pendientes pueden asignarse a una impresora.Un pedido agrupa impresiones y calcula su progreso en base a las impresiones finalizadas. Cuando todas sus impresiones válidas están finalizadas, el pedido queda listo en taller. Luego puede marcarse como entregado.La asignación automática toma impresiones pendientes e impresoras disponibles, aplicando una estrategia seleccionada: orden automático, duración estimada o largo del pedido.El sistema permite consultar estadísticas de producción por día, semana y mes, impresoras en mantenimiento e impresio
```