# CU2 - Gestion de Pedidos

## Alcance

Este modulo permite crear, consultar, editar, cancelar, eliminar logicamente y
marcar como entregados los pedidos de produccion de una granja de impresion 3D.
Un pedido no representa una compra ni una gestion comercial completa: representa
un paquete operativo que agrupa una o mas impresiones que deben producirse,
seguirse y finalmente entregarse.

El objetivo del modulo es organizar conjuntos de impresiones, dar trazabilidad
al avance del paquete y permitir saber si un pedido esta pendiente, incompleto,
listo en taller, entregado o cancelado.

Incluye:

- Crear pedidos como paquetes de impresiones.
- Consultar pedidos individuales y listados filtrables.
- Editar datos generales del pedido mientras su estado lo permita.
- Asociar impresiones existentes o nuevas al pedido desde el flujo de gestion de
  impresiones.
- Consultar las impresiones asociadas a un pedido.
- Calcular el porcentaje de progreso segun las impresiones asociadas.
- Recalcular el estado del pedido cuando cambian sus impresiones.
- Marcar un pedido `LISTO_EN_TALLER` como `ENTREGADO`.
- Cancelar pedidos cuando sus reglas de estado lo permitan.
- Eliminar logicamente pedidos para conservar trazabilidad historica.

Queda explicitamente fuera:

- Autenticacion, usuarios, roles y permisos.
- Frontend o pantallas de gestion.
- Gestion de impresoras.
- CRUD completo de impresiones, que corresponde al modulo `print-jobs`.
- Asignacion manual de impresiones a impresoras.
- Asignacion automatica de impresiones.
- Inicio, finalizacion o cancelacion individual de impresiones.
- Integracion con impresoras WiFi, archivos STL, slicing o control remoto.
- Estadisticas de produccion.
- Facturacion, pagos, presupuestos o gestion comercial avanzada.

La API REST del modulo vive bajo `/api/v1/orders`.

## Entidades

### Order

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | string | si | Identificador unico del pedido |
| orderCode | string | si | Codigo visible y unico del pedido o paquete de impresiones |
| customerName | string | no | Nombre del cliente, area o referencia operativa asociada al pedido |
| status | enum | si | Estado actual del pedido |
| progressPercentage | number | si | Porcentaje de avance calculado sobre sus impresiones no canceladas |
| estimatedDeliveryDate | Date | no | Fecha estimada de entrega del paquete |
| deliveredAt | Date | no | Fecha en que el pedido fue marcado como entregado |
| cancelledAt | Date | no | Fecha en que el pedido fue cancelado |
| observations | string | no | Notas generales del pedido |
| active | boolean | si | Indica si el pedido sigue activo para operacion |
| createdAt | Date | si | Fecha de creacion |
| updatedAt | Date | si | Fecha de ultima actualizacion |

### OrderPrint

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | string | si | Identificador unico de la relacion |
| orderId | string | si | Pedido al que pertenece la impresion |
| printJobId | string | si | Impresion asociada al pedido |
| active | boolean | si | Indica si la asociacion sigue activa |
| createdAt | Date | si | Fecha en que la impresion fue asociada al pedido |
| updatedAt | Date | si | Fecha de ultima actualizacion de la asociacion |

`OrderPrint` no describe una pieza nueva ni reemplaza al modulo de impresiones.
Su unica responsabilidad es representar que una impresion pertenece a un pedido.
Los datos productivos de la pieza o trabajo individual viven en la entidad de
impresion del modulo `print-jobs`.

## Estados del Pedido

- `PENDIENTE`: el pedido esta activo y todas sus impresiones validas estan
  pendientes, o aun no comenzo la produccion del paquete.
- `INCOMPLETO`: al menos una impresion valida esta corriendo o finalizada, pero
  todavia no estan finalizadas todas las impresiones validas del pedido.
- `LISTO_EN_TALLER`: todas las impresiones validas del pedido estan finalizadas
  y el paquete esta listo para entregar.
- `ENTREGADO`: el pedido listo fue entregado al cliente, area o responsable
  correspondiente.
- `CANCELADO`: el pedido fue cancelado y no debe continuar su produccion.

### Ciclo de vida esperado

1. Un pedido nuevo se crea en `PENDIENTE`.
2. Si todas sus impresiones validas estan `PENDIENTE`, el pedido permanece en
   `PENDIENTE`.
3. Si al menos una impresion valida esta `CORRIENDO` o `FINALIZADA`, pero no
   todas estan finalizadas, el pedido pasa a `INCOMPLETO`.
4. Si todas las impresiones validas estan `FINALIZADA`, el pedido pasa a
   `LISTO_EN_TALLER`.
5. Un pedido `LISTO_EN_TALLER` puede pasar a `ENTREGADO`.
6. Un pedido no entregado puede pasar a `CANCELADO`.

Para el calculo de estado y progreso, una impresion valida es una impresion
activa asociada al pedido cuyo estado no es `CANCELADA`.

## Reglas de Negocio

- `BR-ORDER-001`: Todo pedido debe tener un codigo obligatorio, no vacio y unico entre pedidos activos.
- `BR-ORDER-002`: Si no se informa estado al crear un pedido, el sistema debe crearlo en estado `PENDIENTE`.
- `BR-ORDER-003`: Un pedido agrupa una o muchas impresiones; no agrupa items comerciales ni lineas de compra.
- `BR-ORDER-004`: Una impresion solo puede pertenecer a un pedido activo a la vez, salvo que una spec futura defina duplicacion o reutilizacion.
- `BR-ORDER-005`: Una impresion asociada a un pedido debe existir y estar activa.
- `BR-ORDER-006`: Un pedido sin impresiones asociadas puede existir solo como paquete pendiente, con progreso `0`.
- `BR-ORDER-007`: El progreso del pedido se calcula como `impresiones_finalizadas / impresiones_totales_no_canceladas * 100`.
- `BR-ORDER-008`: Las impresiones `CANCELADA` no deben contarse en el denominador ni en el numerador del progreso.
- `BR-ORDER-009`: Si no hay impresiones activas no canceladas, el progreso del pedido debe ser `0`.
- `BR-ORDER-010`: Si todas las impresiones validas estan `PENDIENTE`, el pedido debe estar `PENDIENTE`.
- `BR-ORDER-011`: Si al menos una impresion valida esta `CORRIENDO` o `FINALIZADA`, pero no todas estan `FINALIZADA`, el pedido debe estar `INCOMPLETO`.
- `BR-ORDER-012`: Un pedido no puede pasar a `LISTO_EN_TALLER` si tiene impresiones validas en estado `PENDIENTE` o `CORRIENDO`.
- `BR-ORDER-013`: Si todas las impresiones validas estan `FINALIZADA`, el pedido debe pasar a `LISTO_EN_TALLER`.
- `BR-ORDER-014`: Un pedido solo puede pasar a `ENTREGADO` si antes esta `LISTO_EN_TALLER`.
- `BR-ORDER-015`: Un pedido `ENTREGADO` no puede editarse, cancelarse, eliminarse ni recibir nuevas impresiones.
- `BR-ORDER-016`: Un pedido `CANCELADO` no puede editarse ni recibir nuevas impresiones.
- `BR-ORDER-017`: Si todas las impresiones asociadas a un pedido fueron canceladas, el pedido debe quedar `CANCELADO`.
- `BR-ORDER-018`: Cancelar un pedido no debe cancelar automaticamente sus impresiones; la cancelacion individual de impresiones pertenece al modulo `print-jobs`.
- `BR-ORDER-019`: Eliminar un pedido debe realizar una baja logica, dejando `active=false`.
- `BR-ORDER-020`: Eliminar logicamente un pedido no debe eliminar sus impresiones historicas.
- `BR-ORDER-021`: No se permite eliminar logicamente un pedido `ENTREGADO`; debe conservarse para trazabilidad.
- `BR-ORDER-022`: El codigo del pedido no debe reutilizarse mientras exista otro pedido activo con el mismo codigo normalizado.
- `BR-ORDER-023`: El estado y progreso del pedido deben recalcularse cada vez que se asocia, desasocia o cambia el estado de una impresion vinculada.
- `BR-ORDER-024`: El sistema debe validar las reglas de estado al ejecutar cada accion para evitar inconsistencias por operaciones concurrentes.

## Validaciones

### Order

- `orderCode`: obligatorio, con `trim`, entre 1 y 50 caracteres.
- `orderCode`: unico entre pedidos activos, ignorando mayusculas, minusculas y espacios externos.
- `customerName`: opcional; si se informa debe aplicar `trim`, no puede ser vacio y maximo 120 caracteres.
- `status`: opcional al crear; por defecto `PENDIENTE`.
- `status`: solo `PENDIENTE`, `INCOMPLETO`, `LISTO_EN_TALLER`, `ENTREGADO` o `CANCELADO`.
- `estimatedDeliveryDate`: opcional; si se informa debe ser una fecha valida.
- `observations`: opcional; si se informa debe aplicar `trim`, no puede ser vacia y maximo 500 caracteres.
- `progressPercentage`: no debe recibirse como entrada; siempre se calcula.
- `deliveredAt`: no debe recibirse al crear ni editar datos generales; se define al marcar como entregado.
- `cancelledAt`: no debe recibirse al crear ni editar datos generales; se define al cancelar.
- `active`: no debe recibirse como entrada publica; se controla por baja logica.

### OrderPrint

- `orderId`: obligatorio y debe referir a un pedido existente, activo, no entregado y no cancelado.
- `printJobId`: obligatorio y debe referir a una impresion existente y activa.
- `printJobId`: no puede estar asociado activamente a otro pedido.
- `active`: no debe recibirse como entrada publica; se controla al asociar o desasociar impresiones.

## Errores

- `ORDER_CODE_REQUIRED`
- `ORDER_CODE_ALREADY_EXISTS`
- `ORDER_INVALID_STATUS`
- `ORDER_NOT_FOUND`
- `ORDER_INACTIVE`
- `ORDER_ALREADY_DELIVERED`
- `ORDER_ALREADY_CANCELLED`
- `ORDER_CANNOT_BE_READY_WITH_PENDING_PRINTS`
- `ORDER_CANNOT_BE_READY_WITH_RUNNING_PRINTS`
- `ORDER_CANNOT_BE_DELIVERED_UNLESS_READY`
- `ORDER_CANNOT_BE_DELETED_WHEN_DELIVERED`
- `ORDER_HAS_NO_VALID_PRINTS`
- `ORDER_CUSTOMER_NAME_INVALID`
- `ORDER_OBSERVATIONS_INVALID`
- `ORDER_ESTIMATED_DELIVERY_DATE_INVALID`
- `ORDER_PRINT_NOT_FOUND`
- `ORDER_PRINT_ALREADY_LINKED`
- `ORDER_PRINT_LINK_NOT_FOUND`
- `ORDER_PRINT_INACTIVE`
- `ORDER_PRINT_INVALID_FOR_PROGRESS`

## Endpoints y Criterios de Aceptacion

### Endpoints

- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `POST /api/v1/orders`
- `PUT /api/v1/orders/:id`
- `PATCH /api/v1/orders/:id/cancel`
- `PATCH /api/v1/orders/:id/deliver`
- `PATCH /api/v1/orders/:id/recalculate-progress`
- `DELETE /api/v1/orders/:id`
- `GET /api/v1/orders/:id/prints`
- `POST /api/v1/orders/:id/prints`
- `DELETE /api/v1/orders/:id/prints/:printJobId`

### Criterios de aceptacion

1. Crear un pedido valido debe guardarlo activo, con estado `PENDIENTE` y progreso `0`.
2. Crear un pedido sin codigo debe fallar con `ORDER_CODE_REQUIRED`.
3. Crear un pedido con codigo repetido entre pedidos activos debe fallar con `ORDER_CODE_ALREADY_EXISTS`.
4. Crear un pedido con fecha estimada invalida debe fallar con `ORDER_ESTIMATED_DELIVERY_DATE_INVALID`.
5. Consultar un pedido existente debe devolver sus datos generales, estado y progreso calculado.
6. Consultar un pedido inexistente debe fallar con `ORDER_NOT_FOUND`.
7. Editar un pedido `PENDIENTE`, `INCOMPLETO` o `LISTO_EN_TALLER` debe actualizar solo campos permitidos.
8. Editar un pedido `ENTREGADO` debe fallar con `ORDER_ALREADY_DELIVERED`.
9. Editar un pedido `CANCELADO` debe fallar con `ORDER_ALREADY_CANCELLED`.
10. Asociar una impresion valida a un pedido activo debe vincularla al pedido y recalcular progreso.
11. Asociar una impresion inexistente debe fallar con `ORDER_PRINT_NOT_FOUND`.
12. Asociar una impresion ya vinculada activamente a otro pedido debe fallar con `ORDER_PRINT_ALREADY_LINKED`.
13. Asociar una impresion a un pedido entregado debe fallar con `ORDER_ALREADY_DELIVERED`.
14. Asociar una impresion a un pedido cancelado debe fallar con `ORDER_ALREADY_CANCELLED`.
15. Consultar las impresiones de un pedido debe devolver solo las asociaciones activas del pedido.
16. Desasociar una impresion de un pedido debe quitar la asociacion activa sin eliminar la impresion.
17. Desasociar una impresion debe recalcular el progreso y estado del pedido.
18. Un pedido con todas sus impresiones validas pendientes debe permanecer `PENDIENTE`.
19. Un pedido con al menos una impresion corriendo o finalizada, y al menos una no finalizada, debe quedar `INCOMPLETO`.
20. Un pedido con impresiones pendientes no debe poder pasar a `LISTO_EN_TALLER`.
21. Un pedido con impresiones corriendo no debe poder pasar a `LISTO_EN_TALLER`.
22. Cuando todas las impresiones validas estan `FINALIZADA`, el pedido debe quedar `LISTO_EN_TALLER` y progreso `100`.
23. Un pedido `LISTO_EN_TALLER` debe poder marcarse como `ENTREGADO`.
24. Un pedido que no esta `LISTO_EN_TALLER` no debe poder marcarse como `ENTREGADO`.
25. Si un pedido tiene 10 impresiones no canceladas y 6 estan finalizadas, el progreso debe ser `60`.
26. Las impresiones canceladas no deben afectar el porcentaje de progreso.
27. Si todas las impresiones asociadas quedan canceladas, el pedido debe quedar `CANCELADO`.
28. Cancelar un pedido debe marcar el pedido como `CANCELADO` sin cancelar automaticamente sus impresiones.
29. Eliminar un pedido no entregado debe hacer baja logica y excluirlo de listados activos.
30. Eliminar un pedido no debe eliminar impresiones asociadas ni borrar trazabilidad historica.
31. Los errores del modulo deben responder con formato consistente `{ "error": { "code": "...", "message": "..." } }`.
32. Los tests deben cubrir reglas de negocio, validaciones principales, cambios de estado y calculo de progreso.
