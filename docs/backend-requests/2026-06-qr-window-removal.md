# Eliminar restricción de ventana de 15 minutos para generación de QR

**Fecha:** 2026-06-06  
**Solicitante:** Camilo  
**Severidad:** Alta  
**Estado:** Pendiente

---

## Contexto

KURO necesita que los Managers y Staff puedan generar el QR de check-in de una clase **con anticipación** (horas o días antes), no solamente 15 minutos antes del inicio de la clase.

La restricción actual genera fricción operativa real:
- Los Managers planifican con anticipación, no al minuto
- El Staff necesita tener el QR listo antes de que lleguen los alumnos
- Si hay un problema técnico a último momento, no hay forma de tener un backup planeado
- Operaciones físicas (imprimir QR, colgarlo en el tatami, prepararlo en pantalla) requieren tiempo de preparación

---

## Comportamiento actual

El endpoint `POST /class-sessions/:sessionId/attendance/qr-token` rechaza la generación del QR si la clase no está dentro de una ventana de aproximadamente 15 minutos antes del inicio.

Esto bloquea casos de uso operativos legítimos como:
- Preparar el QR el día anterior y guardarlo en una tablet
- Pre-imprimir el QR y colgarlo en la academia antes de que llegue el primer alumno
- Generar el QR como parte del setup de la clase recurrente

---

## Comportamiento deseado

### Modelo propuesto

El endpoint `POST /class-sessions/:sessionId/attendance/qr-token` debería:

1. **Permitir la generación del QR en cualquier momento** después de que la sesión esté creada, mientras la sesión no esté en estado `CANCELED` o ya terminada hace mucho.

2. **Devolver el token con su ventana de validez explícita:**

```json
{
  "token": "qr_abc123def456...",
  "qrCodeData": "https://...",
  "validFrom": "2026-06-10T18:45:00.000Z",
  "validUntil": "2026-06-10T20:15:00.000Z",
  "currentStatus": "SCHEDULED",
  "expiresInMinutes": 90
}
```

Donde `currentStatus` puede ser:
- `SCHEDULED` → generado, pero la clase aún no entró en ventana operativa
- `ACTIVE` → la clase está dentro de su ventana, el QR es funcional
- `EXPIRED` → la ventana operativa terminó, el QR ya no se puede usar

3. **El check-in (cuando el alumno escanea) sigue validando la ventana operativa** en su propio endpoint. Eso no cambia.

### Beneficios del modelo

- El frontend puede mostrar al manager el QR con anticipación y un mensaje claro:
  - "Este QR estará activo desde las 18:45 hasta las 20:15"
  - Cuando la clase entra en ventana, cambia a "QR activo. Los alumnos pueden registrarse"
- Los managers pueden preparar la operativa con tiempo
- No se compromete la seguridad: el QR sigue siendo válido solo en su ventana

---

## Detalle técnico

### Endpoint afectado

`POST /class-sessions/:sessionId/attendance/qr-token`

### Cambios en el shape de respuesta

Agregar al response los campos:

| Campo | Tipo | Descripción |
|---|---|---|
| `validFrom` | ISO 8601 | Momento desde el cual el QR es operativo |
| `validUntil` | ISO 8601 | Momento hasta el cual el QR es operativo |
| `currentStatus` | enum | `SCHEDULED` / `ACTIVE` / `EXPIRED` |

### Validación del check-in

El endpoint que valida el escaneo del QR sigue validando la ventana operativa. El QR generado fuera de ventana NO se puede usar para check-in hasta que entre en `ACTIVE`.

### Configurabilidad

Idealmente, la ventana operativa (cuántos minutos antes/después de la clase el QR es válido) debería ser:

- Configurable a nivel branch settings, o
- Configurable a nivel organization settings

Defaults razonables (sugeridos):
- 30 minutos antes del inicio
- 15 minutos después del fin
- O: toda la duración de la clase + buffer de 15 min antes y después

---

## Impacto frontend (cuando se resuelva)

El frontend KURO necesita ajustes para manejar el modelo nuevo:

1. **Pantalla `/qr` de QR check-in:**
   - Mostrar el QR siempre que esté generado, sin importar si está en ventana
   - Mostrar banner contextual según `currentStatus`:
     - `SCHEDULED`: "El QR se activará el {validFrom}"
     - `ACTIVE`: "QR activo. Los alumnos pueden registrarse"
     - `EXPIRED`: "Este QR ya expiró. Generá uno nuevo si es necesario"

2. **Generación del QR:**
   - Hoy: solo el botón aparece cuando la clase está cerca
   - Después: el botón aparece siempre que la sesión no esté cancelada/terminada

3. **`expiresInMinutes` hardcoded en frontend:**
   - Actualmente está hardcodeado en `15` porque el backend rechazaba valores mayores
   - Cuando este pedido se resuelva, el frontend puede:
     - Eliminar el hardcode
     - Dejar que el backend devuelva el cap real
     - O exponer la configurabilidad en UI

---

## Workaround actual

- El botón "Generar QR" en el frontend solo se habilita en una ventana limitada antes de la clase
- El frontend hardcodea `expiresInMinutes: 15` porque el backend rechaza valores mayores sin documentar el cap real
- Los usuarios reciben fricción al intentar planificar con anticipación

---

## Prioridad sugerida

**Alta.**

Razones:
1. Es un caso de uso operativo cotidiano de los managers
2. Sin esto, KURO se siente "amateur" comparado con otras plataformas (Mindbody, ClassPass, etc.)
3. La solución no compromete seguridad (la ventana operativa sigue validándose en el check-in)
4. Es un cambio backward-compatible si se hace bien (los clientes viejos siguen funcionando)