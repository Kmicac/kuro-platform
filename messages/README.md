# Mensajes i18n — KURO

Textos de la interfaz, gestionados con **next-intl**. Idioma base: **español neutro
('tú' estándar)**. Es la única fuente de verdad para todo texto visible: si no está
acá, no debe renderizarse.

## Estructura

```
messages/
└── es/
    ├── common.json        → acciones, paginación, roles, status, tiempos relativos, meta
    ├── auth.json          → login, showcase, errores de auth
    ├── navigation.json    → sidebar, topbar, breadcrumbs
    ├── dashboard.json     → org dashboard + branch dashboard
    ├── calendar.json      → calendario, toolbar, grilla, session detail, tipos/estados de clase
    ├── students.json      → lista y ficha de alumnos, fajas
    ├── intake.json        → captación (academy intake)
    ├── claims.json        → invitaciones de cuenta
    ├── errors.json        → error / forbidden / not-found / toasts
    └── empty-states.json  → empty states por pantalla
```

Cada archivo es un **namespace**. Se cargan y mergean server-side en `i18n/request.ts`.
La lista de namespaces vive en `i18n/request.ts` (`NAMESPACES`) y en
`i18n/messages.d.ts` (tipo `Messages`) — **mantener las tres sincronizadas** al sumar
o renombrar un archivo.

## Cómo agregar un texto nuevo

1. Elegí el namespace correcto (compartido → `common`; propio de un módulo → su archivo).
2. Agregá la key en **camelCase**, descriptiva (no `text1`, `label2`).
3. Mantené el orden lógico dentro del archivo: **headers → acciones → errores**.
4. Usalo en el componente:
   - Client: `const t = useTranslations('namespace'); ... {t('miKey')}`
   - Server / metadata: `const t = await getTranslations('namespace')`
5. Verificá con `pnpm tsc --noEmit`: el tipado es estricto (ver "Type-safe"), una key
   inexistente o mal escrita es **error de compilación**.

## Convenciones de keys

- **camelCase** para keys de texto: `viewProfile`, `loadErrorTitle`.
- **Mapas de enum** (status, roles, tipos): la key ES el valor del enum del backend,
  en su forma original (`SCHEDULED`, `MESTRE`, `TRIAL_CLASS`). El componente hace
  `t(enumValue)` con un translator scopeado (`useTranslations('intake.status')`).
- Agrupar por sub-objeto cuando hay familia de keys (`session.attendance.present`).

## Interpolación de variables

```json
"subtitleWithSlug": "Vista completa de todas las filiales · {slug}",
"weekRange": "Semana del {left} al {right} {year}"
```
```tsx
t('subtitleWithSlug', { slug })
t('weekRange', { left, right, year })
```

## Plurales (ICU MessageFormat)

Nunca concatenar `count + ' alumnos'`. Usar ICU:

```json
"count": "{count, plural, =1 {1 alumno} other {# alumnos}}",
"daysAgo": "{count, plural, =1 {Hace 1 día} other {Hace # días}}"
```
```tsx
t('count', { count: total })
```
`#` se reemplaza por el número formateado según el locale.

## Fechas y números

NO hardcodear formatos ni `toLocaleDateString`. Usar `useFormatter()` (client) /
`getFormatter()` (server):

```tsx
const format = useFormatter()
format.dateTime(new Date(iso), { day: '2-digit', month: 'long', year: 'numeric' })
format.number(total)
```
Para tiempos relativos estables (evita `Date.now()` impuro en render): `useNow()`.
La `timeZone` por defecto está en `i18n/config.ts`.

## Type-safe

`i18n/messages.d.ts` aumenta `next-intl` con el shape de `messages/es/*.json`. Esto hace
que `useTranslations('ns')` y `t('key')` estén **tipados**: un `t('keyMal')` es error de
TS. Para keys dinámicas (enum del backend) usar el guard `t.has(value) ? t(value) : value`.

## Términos que NO se traducen

| Categoría | Se mantiene |
|---|---|
| Marca / producto | **KURO**, Mercado Pago, Smoothcomp |
| Roles | **Mestre**, **Manager**, **Head Coach**, **Staff** (universales en BJJ/operaciones); Org admin→Administrador, Student→Alumno |
| BJJ — modalidades | **GI**, **No-Gi**, **Open Mat** |
| BJJ — graduaciones | **Faixa** (header); nombres de faja vienen del backend (`rank.label`) |
| BJJ — varios | **Tatami**, **grado/grados** (stripes) |

> Términos producto en inglés que SÍ se tradujeron a español neutro:
> Branch→Filial, Org→Organización, Dashboard→Panel, Academy Intake→Captación,
> Roster→Padrón, Pipeline→Embudo.

Si aparece un término BJJ universal nuevo (drilling, rolling, sparring…) **no traducir
sin confirmar** con el equipo.

## Cómo se agregará inglés / portugués (futuro)

Hoy la app corre con un solo idioma y SIN prefijo `/es/` en la URL. Para sumar `en`/`pt`:

1. Crear `messages/en/` y `messages/pt/` replicando la estructura de `es/`
   (mismas keys, valores traducidos). `es` es la fuente de verdad del shape.
2. Ampliar `locales` en `i18n/config.ts` → `['es', 'en', 'pt']`.
3. Crear `middleware.ts` con `createMiddleware(routing)` (ver `i18n/routing.ts`).
4. Mover `app/*` a `app/[locale]/*`.
5. En `i18n/request.ts`, resolver el locale desde `requestLocale` en vez de fijarlo.
6. Usar los helpers de `next-intl/navigation` derivados de `routing` para `Link`/`useRouter`.
7. Migrar los strings pendientes de `components/ui/event-manager.tsx` (UI vendored hoy
   deshabilitada — ver el `TODO(i18n)` al tope de ese archivo).
