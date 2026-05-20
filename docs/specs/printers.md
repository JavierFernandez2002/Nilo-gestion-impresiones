# CU1 - Gestion de Impresoras

## Alcance

Este modulo permite crear, consultar, editar, cambiar estado operativo y eliminar logicamente impresoras 3D. No incluye pedidos, impresiones, asignacion automatica, estadisticas, frontend ni autenticacion.

La API REST del modulo vive bajo `/api/v1/printers`.

## Entidad

### Printer

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| id | string | si | Identificador unico |
| name | string | si | Nombre visible de la impresora |
| normalizedName | string | si | Nombre normalizado para unicidad entre activas |
| status | enum | si | Estado operativo |
| model | string | no | Modelo de la impresora |
| location | string | no | Ubicacion fisica |
| ipWifi | string | no | IPv4 asignada por WiFi |
| active | boolean | si | Indica si la impresora esta activa |
| createdAt | Date | si | Fecha de creacion |
| updatedAt | Date | si | Fecha de ultima actualizacion |

## Estados

- `LISTA`
- `IMPRIMIENDO`
- `MANTENIMIENTO`

## Reglas de negocio

- `BR-PRINTER-001`: Toda impresora debe tener un nombre obligatorio, no vacio y unico entre impresoras activas.
- `BR-PRINTER-002`: Toda impresora debe tener exactamente un estado operativo perteneciente a `LISTA`, `IMPRIMIENDO` o `MANTENIMIENTO`.
- `BR-PRINTER-003`: Si no se informa estado al crear una impresora, el sistema debe crearla en estado `LISTA`.
- `BR-PRINTER-004`: Solo las impresoras en estado `LISTA` y activas pueden recibir nuevas impresiones.
- `BR-PRINTER-005`: Una impresora en estado `MANTENIMIENTO` no puede recibir impresiones.
- `BR-PRINTER-006`: Una impresora en estado `IMPRIMIENDO` no puede recibir otra impresion.
- `BR-PRINTER-007`: Una impresora solo puede pasar a `IMPRIMIENDO` como consecuencia de asignarle una impresion pendiente. No se permite cambio manual directo desde el CRUD.
- `BR-PRINTER-008`: Una impresora solo puede pasar de `IMPRIMIENDO` a `LISTA` como consecuencia de finalizar o cancelar su impresion activa. No se permite cambio manual directo desde el CRUD.
- `BR-PRINTER-009`: Una impresora en estado `IMPRIMIENDO` no puede eliminarse ni enviarse a mantenimiento mientras tenga una impresion activa.
- `BR-PRINTER-010`: Eliminar una impresora debe realizar una baja logica, dejando `active=false`.
- `BR-PRINTER-011`: Una impresora inactiva no puede recibir impresiones ni aparecer como disponible para asignacion.
- `BR-PRINTER-012`: El sistema debe validar las reglas de estado al ejecutar la accion para evitar inconsistencias por operaciones concurrentes.

## Validaciones

- `name`: obligatorio, con `trim`, entre 1 y 80 caracteres.
- `name`: unico entre impresoras activas, ignorando mayusculas, minusculas y espacios externos.
- `status`: opcional al crear; por defecto `LISTA`.
- `status`: solo `LISTA`, `IMPRIMIENDO` o `MANTENIMIENTO`.
- `model`: opcional; si se informa no puede ser vacio y maximo 100 caracteres.
- `location`: opcional; si se informa no puede ser vacia y maximo 100 caracteres.
- `ipWifi`: opcional; si se informa debe ser una IPv4 valida.

## Errores

- `PRINTER_NAME_REQUIRED`
- `PRINTER_NAME_ALREADY_EXISTS`
- `PRINTER_INVALID_STATUS`
- `PRINTER_NOT_FOUND`
- `PRINTER_IN_MAINTENANCE`
- `PRINTER_ALREADY_PRINTING`
- `PRINTER_HAS_ACTIVE_PRINT`
- `PRINTER_INACTIVE`
- `PRINTER_INVALID_IP`
- `PRINTER_MODEL_INVALID`
- `PRINTER_LOCATION_INVALID`

## Endpoints

- `GET /api/v1/printers`
- `GET /api/v1/printers/:id`
- `POST /api/v1/printers`
- `PUT /api/v1/printers/:id`
- `PATCH /api/v1/printers/:id/status`
- `DELETE /api/v1/printers/:id`

## Criterios de aceptacion

1. Crear una impresora valida debe guardarla activa y en estado `LISTA` por defecto.
2. Crear una impresora sin nombre debe fallar.
3. Crear una impresora con nombre repetido entre activas debe fallar.
4. Crear una impresora con estado invalido debe fallar.
5. Editar modelo, ubicacion o IP debe respetar validaciones.
6. Eliminar una impresora debe hacer baja logica.
7. Una impresora inactiva no debe aparecer como disponible.
8. No debe permitirse cambiar manualmente una impresora a `IMPRIMIENDO` desde el CRUD.
9. No debe permitirse mandar a mantenimiento una impresora que esta `IMPRIMIENDO`.
10. Los tests deben cubrir reglas de negocio y validaciones principales.
