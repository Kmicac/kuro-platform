# Backend Requests — KURO Platform

Documentación viva de pedidos al equipo backend. Cada pedido es un archivo Markdown que se manda al equipo y queda como registro histórico.

**Última actualización:** Junio 2026

---

## Cómo funciona

1. Cuando se detecta un gap, bug o mejora necesaria del backend → se crea un archivo `YYYY-MM-<slug>.md`
2. Se completa con el formato estándar (ver template abajo)
3. Se manda al equipo backend (Slack, email, ticket — lo que usen)
4. Se trackea aquí el estado
5. Cuando el backend lo implementa → se marca como ✅ y se elimina el workaround del frontend

---

## Pedidos activos

| Fecha | Pedido | Severidad | Estado | Workaround actual |
|---|---|---|---|---|
| 2026-06 | [Error 409 estructurado en attendance](./2026-06-attendance-error-code.md) | Media | 🟡 Pendiente | Regex sobre `message` |
| 2026-06 | [Eliminar ventana de 15min para generar QR](./2026-06-qr-window-removal.md) | Alta | 🟡 Pendiente | Bloqueado hasta 15 min antes |

---

## Pedidos resueltos

Ninguno aún.

---

## Template para nuevos pedidos

```markdown
# [Título del pedido]

**Fecha:** YYYY-MM-DD  
**Solicitante:** [tu nombre]  
**Severidad:** Alta / Media / Baja  
**Estado:** Pendiente  

## Contexto

[Por qué necesitamos esto, qué problema resuelve]

## Comportamiento actual

[Cómo funciona hoy, qué es lo que está mal]

## Comportamiento deseado

[Cómo debería funcionar]

## Detalle técnico

[Endpoints afectados, shapes esperados, campos nuevos, etc.]

## Impacto frontend

[Qué tiene que cambiar en frontend cuando esto se resuelva]

## Workaround actual

[Qué hace el frontend mientras tanto]

## Prioridad sugerida

[Por qué es alta/media/baja]
```