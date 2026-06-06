# Backend request — 409 estructurado para ventana de asistencia

> **Fecha:** 2026-06 · **Prioridad:** media · **Origen:** auditoría Sprint 2 (Dim 4)
> **Estado frontend:** mitigado con fallback de regex en `lib/api/error-parsers.ts`
> (`TODO(backend-error-code)`).

## Pedido

Hoy el frontend detecta "asistencia fuera de ventana" parseando el `message`
del 409 con un regex (`/only allowed between (\S+) and (\S+)/i`). Es frágil:
cualquier cambio de wording en el backend rompe la extracción del rango.

Necesitamos que los errores 409 de asistencia fuera de ventana devuelvan un
shape **estructurado**:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "ATTENDANCE_OUTSIDE_WINDOW",
  "message": "Staff attendance operation is only allowed between ...",
  "windowStart": "2026-06-17T10:00:00.000Z",
  "windowEnd": "2026-06-17T15:00:00.000Z",
  "path": "...",
  "requestId": "..."
}
```

Campos nuevos requeridos:
- `code`: `"ATTENDANCE_OUTSIDE_WINDOW"` (discriminador estable)
- `windowStart`, `windowEnd`: ISO 8601 UTC

Con esto, el frontend elimina el parsing por string (fragilidad) y muestra el
rango de la ventana de forma confiable.

## Endpoints afectados

- `POST /class-sessions/:id/attendance`
- `PATCH /class-sessions/:id/attendance/:studentId`
- `DELETE /class-sessions/:id/attendance/:studentId`

## Compatibilidad

El frontend ya acepta **ambos** shapes (estructurado preferido, regex como
fallback). Cuando el backend agregue `code` + `windowStart`/`windowEnd`, no se
rompe nada; recién entonces se elimina el fallback de regex. No hay que
coordinar un release simultáneo.
