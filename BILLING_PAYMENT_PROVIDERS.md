# Fase 5 — Billing + Payment Providers (Mercado Pago first)

Spec arquitectónica vinculante para la construcción del módulo Billing en el frontend web operador de KURO.

**Estado:** propuesta para revisión, shapes `billing-summary` y `student-financial-statuses` confirmados
**Generada:** 2026-06-09
**Alcance:** web operador (Next.js). La superficie student self-service (`students/me/*` billing) la consume la app Flutter de Gonzalo, queda fuera de scope frontend web.
**Dependencias backend:** todas las rutas listadas existen y están documentadas en `API-CONTRACT.md` (sync 2026-06-08). El módulo backend Billing y la integración Mercado Pago están implementados (POST preference, webhook handler, reconciliation).

---

## 0. Alcance y exclusiones V1

### Dentro de Fase 5 (V1)

- CRUD de **Billing Plans** por branch.
- Asignación y gestión de **Student Memberships** (plan + ciclo de cobro).
- Emisión de **Charges** manuales (cargo único o asociado a membership).
- Registro de **Payments** manuales (cash, transfer, MANUAL en general).
- Integración **Mercado Pago**: alta de credenciales, generación de preferencias, observación de webhook events, conciliación dependiente del backend.
- **Reconciliation read-only**: la conciliación la hace el backend; el frontend solo refleja el estado resultante.
- **Financial Status** por alumno y agregado por branch.
- **Dashboard operativo** de billing branch-local (cobrado mes, pendientes, vencidos, próximos vencimientos).
- **Billing Policy** por branch (config de attendance restriction, días de gracia, etc.).
- Detección y revisión de **possible duplicates** de payments.

### Fuera de scope V1 (fases posteriores explícitas)

- Generación automática recurrente de charges (cron de emisión mensual). El backend puede tenerlo o no; el frontend asume creación manual o por endpoint puntual y NO afirma automatización.
- Reminders / notificaciones automáticas de cobranza (push/email/WhatsApp).
- Integración con otros providers (Stripe, Naranja X, Ualá, Modo, PayU, Transbank, Pix backend). Arquitectura preparada, implementación no.
- Reporting analítico avanzado (cohortes, LTV, churn financiero).
- Multi-moneda. V1 = ARS only.
- Multi-organización dentro del mismo branch.
- Self-service de alumno desde web (lo cubre la app móvil).
- Smoothcomp/competitions billing.
- Refund flow desde UI (si surge necesidad, se hace por backend en V1).

---

## 1. Reglas vinculantes (no negociables)

1. **Backend = única fuente de verdad** del estado de pago. El frontend nunca confirma un pago por query params del redirect de Mercado Pago. Tras un retorno desde checkout, refresca contra el backend.
2. **Provider-agnostic core**: el dominio Billing (Plan, Membership, Charge, Payment, FinancialStatus) NO conoce a Mercado Pago. MP es un caso concreto de `PaymentProvider`.
3. **Componentes específicos de MP están aislados** bajo nombres explícitos (`MercadoPagoIntegrationForm`, `MercadoPagoCheckoutProAssistedLink`, `MercadoPagoWebhookEventsTable`). Componentes genéricos NUNCA llevan `MercadoPago` en el nombre.
4. **Credenciales jamás expuestas en cliente**: `accessToken` de MP vive solo en backend. Frontend solo recibe `publicKey`, `status` del integration, último sync, y datos no sensibles.
5. **Capabilities gateando, no roles**: cada acción de UI consulta `capabilities.billing.*` o `capabilities.integrations.*`. Nada de `if (role === "ORG_ADMIN")`.
6. **i18n absoluto**: todo texto visible en `messages/es/billing.json` con keys jerárquicas. Cero strings hardcodeados.
7. **Operator vs student split**: rutas `/billing/...` solo para operador; rutas `students/me/billing-*` quedan documentadas pero NO se implementan en web.
8. **Rutas de API canónicas**: siempre `/api/v1/organizations/:organizationId/...` o `/api/v1/organizations/:organizationId/branches/:branchId/...` o `/api/v1/organizations/:organizationId/students/:studentId/...`. Cero shortcuts.
9. **Diseño extensible para nuevos providers**: agregar Ualá/Modo/etc. en el futuro debe requerir solo (a) un componente de integration form específico y (b) una entry en el registry de providers. Las tablas, charges, payments y dashboards no se tocan.
10. **Money type discipline**: los endpoints de billing devuelven amounts como `string` decimal (`"350.00"`, no `35000`). NO son minor units. NO vienen como `{ amount, currency, formatted }`. Tipar el API response tal como llega (`DecimalJsonString = string`); crear view-models/adapters para renderizar. Utility común `formatDecimalMoney(value: string, currency?: string): string`. Si no hay currency, usar fallback neutral o texto i18n `billing.currency.unknown`.
11. **Shapes confirmados primero**: 5.1 NO empieza con hooks/UI hasta que `lib/api/billing.types.ts` refleje exactamente los shapes reales de `billing-summary` y `student-financial-statuses`.
12. **Permisos reales backend**: aunque el contrato nombre `billing.canReadBilling`, el backend restringe estas lecturas con `ensureCanManageBranchBilling`. El frontend gatea con capabilities disponibles, pero siempre maneja `403` con `ForbiddenState` y copy i18n específico.

---

## 2. Modelo de dominio

Todos los tipos viven en `lib/api/billing.types.ts` (o `lib/api/types.ts` si se prefiere centralización). Provider-agnostic salvo donde se indica.

### 2.1 BillingPlan

Plantilla de cobro recurrente o de cuota fija por branch.

```ts
// Tipo base para todos los montos que llegan del backend como string decimal
type DecimalJsonString = string;

type BillingFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";

// API response shape — tipar tal como llega
interface BillingPlanResponse {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  description: string | null;
  amount: DecimalJsonString;   // ej: "350.00" — no minor units, no object
  currency: string;            // ej: "ARS"
  enrollmentFeeAmount: DecimalJsonString | null;
  billingFrequency: BillingFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// View-model para uso en UI (adapter transforma API → VM)
interface BillingPlanVM extends BillingPlanResponse {
  amountFormatted: string;     // producido por formatDecimalMoney(amount, currency)
}
```

### 2.2 StudentMembership

Asociación alumno ↔ plan, con next billing date.

```ts
type MembershipStatus = "ACTIVE" | "PAUSED" | "FROZEN" | "CANCELED" | "ENDED";

interface StudentMembership {
  id: string;
  organizationId: string;
  branchId: string;
  studentId: string;
  billingPlanId: string;
  plan: BillingPlanResponse | null;
  status: MembershipStatus;
  startedAt: string;        // YYYY-MM-DD
  nextBillingDate: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 BillingCharge

Cargo emitido a un alumno. Puede estar atado o no a un payment.

```ts
type BillingChargeType = "MEMBERSHIP" | "ENROLLMENT" | "ADJUSTMENT" | "MANUAL";
type BillingChargeStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELED"
  | "VOID";

interface BillingChargeResponse {
  id: string;
  organizationId: string;
  branchId: string;
  studentId: string;
  studentMembershipId: string | null; // null para cargos one-off
  billingPlanId: string | null;
  chargeType: BillingChargeType;
  description: string;
  amount: DecimalJsonString;
  amountPaid?: DecimalJsonString;
  outstandingAmount?: DecimalJsonString;
  currency: string;
  periodStart: string | null;       // YYYY-MM-DD
  periodEnd: string | null;         // YYYY-MM-DD
  dueDate: string;                  // YYYY-MM-DD
  status: BillingChargeStatus;
  payments?: PaymentResponse[];     // si el endpoint detail/list lo incluye
  createdAt: string;
  updatedAt: string;
}

interface BillingChargeVM extends BillingChargeResponse {
  amountFormatted: string;
  amountPaidFormatted: string | null;
  outstandingAmountFormatted: string | null;
}
```

### 2.4 Payment

Registro de pago. Puede ser manual o vía provider.

```ts
type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED"
  | "FAILED"
  | "REFUNDED"
  | "CHARGED_BACK";
type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "MERCADO_PAGO"
  | "TAKENOS"
  | "OTHER";
type PaymentKind = "STUDENT_PAYMENT" | "GENERAL_INCOME";
type PaymentSource = "MANUAL" | "PROVIDER_WEBHOOK" | "RECONCILIATION";

interface PaymentResponse {
  id: string;
  organizationId: string;
  branchId: string;
  studentId: string | null;
  billingChargeId: string | null;   // null si es general-income
  paymentKind: PaymentKind;
  grossAmount: DecimalJsonString;
  netAmount: DecimalJsonString;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  source: PaymentSource;
  externalProvider: string | null;
  externalReference: string | null; // MP payment id, etc. opaco al UI
  recordedAt: string;
  notes: string | null;
  createdAt: string;
}

interface PaymentVM extends PaymentResponse {
  grossAmountFormatted: string;
  netAmountFormatted: string;
}
```

### 2.5 BranchBillingSummary

Agregado operativo branch-local para el dashboard de billing.

```ts
type DecimalJsonString = string;

type StudentFinancialStatus =
  | "CURRENT"
  | "DUE_SOON"
  | "OVERDUE"
  | "RESTRICTED"
  | "FROZEN";

interface BranchBillingSummaryResponse {
  grossTotal: DecimalJsonString;
  netTotal: DecimalJsonString;
  approvedPaymentsCount: number;
  pendingPaymentsCount: number;
  pendingChargesCount: number;
  overdueChargesCount: number;
  paidChargesCount: number;
  possibleDuplicatesCount: number;
  period: {
    dateFrom: string;
    dateTo: string;
  };
  currency?: string;
  operationalSnapshot: {
    asOf: string;
    studentFinancialStatusCounts: Record<StudentFinancialStatus, number>;
    overdueStudentsCount: number;
    dueSoonStudentsCount: number;
    restrictedStudentsCount: number;
  };
}

interface BranchBillingSummaryVM extends BranchBillingSummaryResponse {
  displayCurrency: string | null;
  grossTotalFormatted: string;
  netTotalFormatted: string;
  currencyLabel: string;
}
```

Query params:

```ts
interface BranchBillingSummaryQuery {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  currency?: string; // ISO 4217 uppercase
}
```

Notas:
- `grossTotal` y `netTotal` son string decimal. No convertir como minor units.
- La respuesta omite `currency` si no se envía `query.currency`.
- El adapter recibe `displayCurrency = query.currency ?? branchCurrency ?? policyCurrency ?? null`.
- Si no hay moneda resoluble, mostrar el valor decimal con etiqueta i18n `billing.currency.unknown`.

### 2.6 BranchStudentFinancialStatuses

Estado financiero por alumno dentro de una filial.

```ts
type BranchStudentMembershipStatus =
  | "ACTIVE"
  | "PAUSED"
  | "FROZEN";

interface BranchStudentFinancialStatusItem {
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  membership: {
    id: string;
    status: BranchStudentMembershipStatus;
  } | null;
  financialStatus: StudentFinancialStatus;
  daysOverdue: number;
  nextDueDate: string | null; // ISO datetime, no date-only
  hasOverdueCharges: boolean;
  hasPendingCharges: boolean;
  activeRestrictionFlags: {
    attendanceRestricted: boolean;
    appUsageRestricted: boolean;
  };
  totalDue: DecimalJsonString;
}

interface BranchStudentFinancialStatusesResponse {
  items: BranchStudentFinancialStatusItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

interface BranchStudentFinancialStatusVM extends BranchStudentFinancialStatusItem {
  studentName: string;
  totalDueFormatted: string;
  nextDueDateFormatted: string | null;
  restrictionCount: number;
}
```

Query params:

```ts
interface BranchStudentFinancialStatusesQuery {
  page?: number;
  limit?: number;
  financialStatus?: StudentFinancialStatus;
}
```

Notas:
- `financialStatus: "OK"` no existe.
- `totalDue` es string decimal.
- `meta` no trae `totalPages`; calcularlo en UI solo como derivado si hace falta.
- El endpoint no devuelve `currency` por item. El adapter usa la moneda resuelta para la pantalla; si no existe, muestra fallback neutral.
- Labels i18n obligatorios para `CURRENT`, `DUE_SOON`, `OVERDUE`, `RESTRICTED`, `FROZEN`.

### 2.7 Billing view-model adapters

```ts
function toBranchBillingSummaryVM(
  response: BranchBillingSummaryResponse,
  options: {
    queryCurrency?: string;
    branchCurrency?: string | null;
    policyCurrency?: string | null;
    unknownCurrencyLabel: string;
  }
): BranchBillingSummaryVM;

function toBranchStudentFinancialStatusVM(
  item: BranchStudentFinancialStatusItem,
  options: {
    displayCurrency: string | null;
    unknownCurrencyLabel: string;
    formatDateTime: (value: string) => string;
  }
): BranchStudentFinancialStatusVM;
```

Reglas de adapter:
- No mutar ni normalizar el API response original.
- No inventar moneda.
- No usar `toLocaleString` directo en componentes; usar adapter/helper central y `useFormatter`.
- Si `displayCurrency === null`, renderizar el decimal original y la etiqueta `billing.currency.unknown`.

### 2.8 PaymentProvider (abstracción)

Provider-agnostic. El registry de providers vive en `lib/billing/providers.ts`.

```ts
type PaymentProviderKey = "MERCADO_PAGO"; // | "STRIPE" | "UALA" | "MODO" en futuro

interface PaymentProviderDescriptor {
  key: PaymentProviderKey;
  displayName: string;            // i18n key
  supportedMethods: PaymentMethod[];
  supportsCheckoutPreference: boolean;
  supportsWebhook: boolean;
}
```

### 2.9 PaymentIntegration

Configuración del provider a nivel branch.

```ts
type IntegrationStatus = "PENDING" | "ACTIVE" | "ERROR" | "DISABLED";

interface PaymentIntegration {
  id: string;
  organizationId: string;
  branchId: string;
  provider: PaymentProviderKey;
  status: IntegrationStatus;
  publicKey: string | null;       // solo el dato no sensible
  lastSyncAt: string | null;
  lastSyncStatus: "SUCCEEDED" | "FAILED" | null;
  webhookSecretPreview: string | null; // "***last4" o similar, nunca completo
  createdAt: string;
  updatedAt: string;
}
```

### 2.10 BillingPolicy

Config por branch.

```ts
interface BillingPolicy {
  branchId: string;
  attendanceRestrictionEnabled: boolean;
  gracePeriodDays: number;
  blockAfterDaysOverdue: number;
  autoChargeOnMembershipRenewal: boolean;
}
```

---

## 3. Endpoints (mapa real del API-CONTRACT 2026-06-08)

### 3.1 Operator surface (web consume)

**Plans**
- `GET    /organizations/:organizationId/branches/:branchId/billing-plans`
- `POST   /organizations/:organizationId/branches/:branchId/billing-plans`
- `PATCH  /organizations/:organizationId/branches/:branchId/billing-plans/:planId`

**Memberships**
- `GET    /organizations/:organizationId/students/:studentId/membership`
- `POST   /organizations/:organizationId/students/:studentId/membership`
- `PATCH  /organizations/:organizationId/students/:studentId/membership`

**Charges**
- `GET    /organizations/:organizationId/branches/:branchId/billing-charges`
- `GET    /organizations/:organizationId/students/:studentId/billing-charges`
- `POST   /organizations/:organizationId/students/:studentId/billing-charges`
- `GET    /organizations/:organizationId/students/:studentId/billing-context`

**Payments**
- `GET    /organizations/:organizationId/branches/:branchId/payments`
- `GET    /organizations/:organizationId/branches/:branchId/payments/possible-duplicates`
- `GET    /organizations/:organizationId/students/:studentId/payments`
- `POST   /organizations/:organizationId/students/:studentId/payments/manual`
- `POST   /organizations/:organizationId/branches/:branchId/general-income`

**Mercado Pago preference**
- `POST   /organizations/:organizationId/students/:studentId/billing-charges/:chargeId/mercado-pago/preference`

**Financial Status & Summary**
- `GET    /organizations/:organizationId/branches/:branchId/student-financial-statuses`
- `GET    /organizations/:organizationId/branches/:branchId/billing-summary`
- `GET    /organizations/:organizationId/branches/:branchId/billing-policy`
- `PATCH  /organizations/:organizationId/branches/:branchId/billing-policy`

**Integrations (provider config)**
- `GET    /organizations/:organizationId/integrations`
- `POST   /organizations/:organizationId/integrations`
- `PATCH  /organizations/:organizationId/integrations/:integrationId`
- `POST   /organizations/:organizationId/integrations/:integrationId/test`
- `POST   /organizations/:organizationId/integrations/:integrationId/sync`
- `GET    /organizations/:organizationId/integrations/:integrationId/external-links`
- `POST   /organizations/:organizationId/integrations/:integrationId/external-links`
- `GET    /organizations/:organizationId/integrations/:integrationId/sync-jobs`
- `GET    /organizations/:organizationId/integrations/:integrationId/webhook-events`
- `GET    /organizations/:organizationId/integrations/:integrationId/webhook-events/:eventId`
- `POST   /organizations/:organizationId/integrations/:integrationId/webhook-events/:eventId/reprocess`

### 3.2 Mobile student surface (web NO consume — documentado para no duplicar y para coordinar con Gonzalo)

- `GET    /organizations/:organizationId/students/me/profile` (incluye billing branch-local)
- `GET    /organizations/:organizationId/students/me/home` (incluye próximo pago, último pago)
- Cualquier consulta de su charge/payment propio el alumno la hace vía estos read models o un endpoint dedicado student-self del módulo billing (revisar con backend si se agrega después).

### 3.3 Webhook (backend only, no frontend)

- `POST   /integrations/webhooks/mercado-pago` — backend recibe webhooks y actualiza el estado real de payments. El frontend NO toca este endpoint, solo refresca queries cuando corresponda.

---

## 4. Capabilities → UI gating

Cada acción de UI consulta `capabilities` desde el store de auth. Mapeo:

| Capability                                          | UI gatea                                                 |
| --------------------------------------------------- | -------------------------------------------------------- |
| `billing.canReadBilling`                            | ver páginas /billing/*, sidebar links                    |
| `billing.canWriteBilling`                           | crear plans, charges, memberships, manual payments       |
| `billing.canCreateMercadoPagoPreference`            | generar link de pago asistido para cargos abiertos       |
| `billing.canManagePaymentIntegrations`              | alta/edición de integration form de MP                   |
| `billing.canReadWebhookEvents`                      | tabla de webhook events                                  |
| `billing.canReprocessWebhookEvents`                 | botón reprocess en cada webhook event                    |
| `integrations.canReadIntegrations`                  | listar integraciones de la org                           |
| `integrations.canManageIntegrations`                | crear/editar/testear/sincronizar integraciones           |
| `integrations.canTestIntegrations`                  | botón "Probar conexión" en integration detail            |
| `integrations.canReadIntegrationWebhookEvents`      | listar webhook events generales (no solo de MP)          |
| `integrations.canReprocessIntegrationWebhookEvents` | botón reprocess genérico                                 |

Notas:
- Para `billing-summary` y `student-financial-statuses`, el backend real puede exigir permisos más estrictos que `billing.canReadBilling` mediante `ensureCanManageBranchBilling`.
- La UI debe ocultar/inhabilitar por capabilities cuando existan, pero un `403` del backend siempre se presenta como estado forbidden recuperable, no como fallo genérico ni pantalla rota.

---

## 5. Provider abstraction

### 5.1 Registry

```ts
// lib/billing/providers.ts
export const PAYMENT_PROVIDERS: Record<PaymentProviderKey, PaymentProviderDescriptor> = {
  MERCADO_PAGO: {
    key: "MERCADO_PAGO",
    displayName: "billing.providers.mercadoPago.name",
    supportedMethods: ["CARD", "MERCADO_PAGO"],
    supportsCheckoutPreference: true,
    supportsWebhook: true,
  },
};
```

Agregar Ualá/Modo en el futuro = una entrada nueva en este map + componentes provider-specific aislados. **El resto del módulo no cambia.**

### 5.2 Componentes provider-agnostic (los que NO deben saber de MP)

- `BillingPlansTable`
- `BillingPlanForm`
- `StudentMembershipPanel`
- `BillingChargesTable`
- `ChargeDetailDrawer`
- `PaymentsTable`
- `ManualPaymentDialog`
- `FinancialStatusBadge`
- `BillingDashboard`
- `BillingPolicyForm`
- `PaymentIntegrationsList`
- `PaymentIntegrationDetail`
- `WebhookEventsTable` (genérica)
- `WebhookEventDetailDialog` (genérica)
- `PossibleDuplicatesPanel`
- `ChargeActionsMenu` — expone acciones genéricas de cobro asistido donde el provider se resuelve desde el registry.

### 5.3 Componentes específicos de Mercado Pago (aislados)

- `MercadoPagoIntegrationForm`
- `MercadoPagoCheckoutProAssistedLink`
- `MercadoPagoWebhookEventDetail` (extiende el genérico con payload-specific rendering)

---

## 6. Árbol de rutas frontend

```
/org/[orgId]/branches/[branchId]/billing/
├── dashboard/                     → BillingDashboard
├── plans/
│   ├── [planId]/                  → BillingPlanDetail + edit
│   └── new/                       → BillingPlanForm
├── charges/
│   ├── [chargeId]/                → ChargeDetailDrawer (open desde tabla)
│   └── possible-duplicates/       → PossibleDuplicatesPanel
├── payments/
├── financial-statuses/            → tabla de estado financiero por alumno
├── policy/                        → BillingPolicyForm
└── integrations/
    ├── [integrationId]/           → PaymentIntegrationDetail
    └── new?provider=MERCADO_PAGO  → registry-driven form

/org/[orgId]/students/[studentId]/billing/
├── overview/                      → membership + charges + payments del alumno
├── charges/[chargeId]/            → detalle + cobro
└── payments/                      → historial alumno
```

Sidebar del operador incluye:
- Billing > Dashboard
- Billing > Plans
- Billing > Charges
- Billing > Payments
- Billing > Financial Statuses
- Billing > Integrations
- Billing > Policy

Gateadas por `billing.canReadBilling`.

---

## 7. Sub-fases

### 5.1 — Setup base + abstracciones provider-agnostic (1.5 días)

- Types completos en `lib/api/billing.types.ts`, empezando por los shapes confirmados:
  - `BranchBillingSummaryResponse`
  - `BranchBillingSummaryQuery`
  - `BranchStudentFinancialStatusItem`
  - `BranchStudentFinancialStatusesResponse`
  - `BranchStudentFinancialStatusesQuery`
  - `StudentFinancialStatus = CURRENT | DUE_SOON | OVERDUE | RESTRICTED | FROZEN`
- Hooks API base (sin UI): `useBillingPlans`, `useBranchCharges`, `useBranchPayments`, `useStudentMembership`, `useStudentCharges`, `useStudentPayments`, `useBranchBillingSummary`, `useBranchBillingPolicy`, `useFinancialStatuses`, `useBranchIntegrations`, `useIntegrationWebhookEvents`.
- Mutations: `useCreatePlan`, `useUpdatePlan`, `useCreateMembership`, `useUpdateMembership`, `useCreateCharge`, `useCreateManualPayment`, `useCreateGeneralIncome`, `useUpdateBillingPolicy`, `useCreateIntegration`, `useUpdateIntegration`, `useTestIntegration`, `useSyncIntegration`, `useReprocessWebhookEvent`.
- `lib/billing/providers.ts` registry con MP placeholder (componentes ausentes hasta 5.4).
- `lib/billing/format-money.ts` utility para string decimal, sin minor units.
- `lib/billing/adapters.ts` con view models para summary y financial statuses; los componentes no formatean dinero desde el response crudo.
- Skeleton de rutas `/billing/*` (páginas vacías con sidebar nav funcionando).
- i18n namespace `messages/es/billing.json` con keys base, incluidos labels para `CURRENT`, `DUE_SOON`, `OVERDUE`, `RESTRICTED`, `FROZEN` y `billing.currency.unknown`.

### 5.2 — Plans + Memberships (1.5 días)

- `BillingPlansTable` + filtros + paginación.
- `BillingPlanForm` (crear/editar).
- `StudentMembershipPanel` integrado en el detalle de alumno.
- Asignación de plan a alumno: dropdown de plans activos + dueDate inicial + fecha de inicio.
- Cambio de plan / pausa / cancelación de membership.
- Lifecycle visible: badge de status, próximo cobro.

### 5.3 — Charges + Manual Payments (1.5 días)

- `BillingChargesTable` (branch level + student level).
- Crear charge manual (one-off o asociado a membership).
- `ChargeDetailDrawer` con lista de payments aplicados.
- `ManualPaymentDialog` (cash/transfer/MANUAL).
- General income (income que no se ata a un alumno específico).
- Possible duplicates panel.
- `FinancialStatusBadge` en student listings.

### 5.4 — Mercado Pago integration (2 días)

- `MercadoPagoIntegrationForm`: alta de credenciales (access token va al backend, publicKey en frontend), branch específico.
- Botón "Probar conexión" → llama `POST /integrations/:id/test`.
- `MercadoPagoCheckoutProAssistedLink`: en cada charge abierto cobrable, acción "Generar link de pago" → llama `POST .../mercado-pago/preference` → recibe `sandboxInitPoint`/`initPoint` → permite copiar link o abrir checkout asistido.
- Tras retorno, NO confirmar nada por query params. Refresca queries del charge/payment desde backend.
- `WebhookEventsTable` para auditoría operativa.
- Reprocess de webhook event individual.
- Status del integration en sidebar de billing (Active/Error con ícono).

### 5.4C-1 — Web/Admin Assisted Payment Link with Mercado Pago Checkout Pro

- Web/admin no es el canal principal de pago del alumno; es un flujo asistido para staff.
- Copy principal: "Generar link de pago", "Copiar link de pago", "Abrir checkout asistido", "Verificar estado del pago".
- Evitar en backoffice: "Pagar con Mercado Pago", "Pagar ahora", "Confirmar pago".
- El redirect de Mercado Pago es solo UX. El backend, vía webhook + verificación con Mercado Pago, sigue siendo la fuente de verdad.
- No llamar APIs de Mercado Pago desde frontend ni manejar `accessToken` en cliente.

### 5.5 — Dashboard + Financial Status (1 día)

- `BillingDashboard` con métricas disponibles en `billing-summary`:
  - Bruto del periodo (`grossTotal`).
  - Neto del periodo (`netTotal`).
  - Pagos aprobados y pendientes.
  - Cargos pendientes, vencidos y pagados.
  - Posibles duplicados.
  - Alumnos por estado financiero (`CURRENT`, `DUE_SOON`, `OVERDUE`, `RESTRICTED`, `FROZEN`).
- No mostrar comparación mes anterior, outstanding calculado, próximos vencimientos 7/30 ni MRR hasta tener endpoint/shape confirmado.
- Tabla de financial statuses con filtros (`CURRENT`, `DUE_SOON`, `OVERDUE`, `RESTRICTED`, `FROZEN`).
- Linking desde dashboard a charges/payments filtrados.

### 5.6 — Billing Policy + pulido (0.5-1 día)

- `BillingPolicyForm` por branch: attendance restriction, grace period, block-after days.
- Validación cruzada: si un alumno cae bajo policy, la asistencia se bloquea (esto lo hace el backend; el frontend solo lo refleja).
- Edge cases: refunds (read-only), payment rechazado, integration en estado ERROR.
- Polishing UX: loading states, empty states, error boundaries.
- Smoke checklist y handoff.

### Estimación total: **8-10 días efectivos** de trabajo focalizado.

---

## 8. Reglas de seguridad

1. **MP `accessToken` nunca llega al frontend.** Backend lo guarda encriptado. El form de integration lo envía vía POST con HTTPS y luego solo se ve el `publicKey` y un preview (`***1234`).
2. **No persistir credenciales en localStorage/sessionStorage.** Si el form necesita state intermedio, vive en memoria del componente.
3. **No loggear payloads de webhook sin sanitizar.** Si la tabla muestra payload, ofuscar campos sensibles del provider (tokens, customer emails completos si la policy lo requiere).
4. **No incluir `accessToken` en URLs, query strings, cookies de cliente, ni headers loggeables.**
5. **Reauth before sensitive ops**: alta/edición de integration con `accessToken` puede requerir step-up auth si el backend lo exige. El frontend respeta el 401/403 step-up y abre el modal de reautenticación.
6. **Webhook reprocess gating**: solo con `canReprocessWebhookEvents`. Mostrar warning antes ("esto puede regenerar payment ya conciliado").
7. **CSP**: si MP requiere abrir `https://www.mercadopago.com.ar/checkout/...` desde el frontend, asegurar que la CSP del proyecto permita esa navegación. No embeber iframes de MP sin validar policy.

---

## 9. Out of scope V1 — explícito

Estos NO se implementan en Fase 5. Quedan documentados para que ningún prompt los introduzca por accidente:

- Cron de generación recurrente de charges.
- Reminders automatizados (push, email, WhatsApp).
- Refund flow desde UI.
- Stripe, Ualá, Modo, Naranja X, PayU, Transbank, Pix backend.
- Multi-moneda.
- Cohorts, LTV, churn analytics.
- Smoothcomp / competitions billing.
- Self-service de alumno desde web (lo hace Flutter).

---

## 10. Wireframes ASCII bloqueantes antes de código

Estos wireframes fijan estructura y prioridades de información. No implican
todavía implementación visual final; al construir se aplican tokens Night Ops,
i18n y estados obligatorios.

### 10.1 BillingDashboard

Ruta propuesta: `/org/[orgId]/branches/[branchId]/billing/dashboard`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Billing                                                                      │
│ Cobranza operativa de la filial                                               │
│                                                                              │
│ [Periodo: 01/06/2026 - 30/06/2026] [Moneda: ARS v] [Actualizar] [+ Cargo]    │
└──────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ Bruto del periodo  │ │ Neto del periodo   │ │ Pagos aprobados    │ │ Pagos pendientes   │
│ ARS 1.250.000,00   │ │ ARS 1.180.000,00   │ │ 84                 │ │ 12                 │
│ 01/06 - 30/06      │ │ moneda resuelta    │ │ conciliados        │ │ por revisar        │
└────────────────────┘ └────────────────────┘ └────────────────────┘ └────────────────────┘

┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ Cargos pendientes  │ │ Cargos vencidos    │ │ Cargos pagados     │ │ Posibles duplicados│
│ 31                 │ │ 9                  │ │ 76                 │ │ 3                  │
│ abrir tabla        │ │ ver vencidos       │ │ ver pagos          │ │ revisar            │
└────────────────────┘ └────────────────────┘ └────────────────────┘ └────────────────────┘

┌──────────────────────────────────────┐ ┌────────────────────────────────────┐
│ Estado financiero de alumnos          │ │ Restricciones operativas           │
│ CURRENT      126  ███████████         │ │ Alumnos vencidos          9        │
│ DUE_SOON      18  ███                 │ │ Próximos a vencer        18       │
│ OVERDUE        9  ██                  │ │ Restringidos             4        │
│ RESTRICTED     4  █                   │ │ Snapshot: 10/06/2026 11:20        │
│ FROZEN         6  █                   │ │                                    │
└──────────────────────────────────────┘ └────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Alumnos por estado financiero                                      [Buscar]  │
│ [Todos] [Al día] [Por vencer] [Vencidos] [Restringidos] [Congelados]         │
├──────────────────────┬──────────────┬────────────┬──────────────┬───────────┤
│ Alumno               │ Estado       │ Total debe │ Próximo venc.│ Restricción│
├──────────────────────┼──────────────┼────────────┼──────────────┼───────────┤
│ Ana Pereira          │ DUE_SOON     │ ARS 0,00   │ 12/06 00:00  │ Ninguna   │
│ Bruno Lima           │ OVERDUE      │ ARS 35.000 │ 01/06 00:00  │ App       │
│ Carla Souza          │ RESTRICTED   │ ARS 70.000 │ 15/05 00:00  │ Asistencia│
└──────────────────────┴──────────────┴────────────┴──────────────┴───────────┘
```

Estados obligatorios:
- `loading`: skeleton con header, 8 KPI blocks, dos paneles y tabla.
- `empty`: summary con todos los contadores en cero y tabla sin alumnos.
- `forbidden`: copy específico de billing; el backend puede exigir `ensureCanManageBranchBilling`.
- `error`: `ErrorState` con `requestId` y retry.
- `currency missing`: montos como decimal raw + etiqueta `billing.currency.unknown`.

Acciones:
- `+ Cargo` requiere `billing.canWriteBilling`.
- Links a cargos/pagos/duplicados preservan filtros de periodo y moneda.
- Filtros usan solo estados confirmados: `CURRENT`, `DUE_SOON`, `OVERDUE`, `RESTRICTED`, `FROZEN`.

### 10.2 ChargeDetailDrawer

Entrada desde tabla de cargos branch-level o student-level. Drawer derecho,
ancho desktop aproximado 480px; en mobile ocupa pantalla completa.

```
┌────────────────────────────────────────────────────┐
│ Cargo                                              │
│ Mensualidad Adultos - Junio 2026                   │
│ [OVERDUE]                         [Cerrar]         │
├────────────────────────────────────────────────────┤
│ Alumno                                             │
│ Ana Pereira                         Ver perfil →   │
│ Branch: SNP Centro                                 │
│ Membership: Mensualidad Adultos                    │
├────────────────────────────────────────────────────┤
│ Importe                                            │
│ Total                 ARS 35.000,00                │
│ Pagado                ARS 10.000,00                │
│ Saldo                 ARS 25.000,00                │
│ Vencimiento           01/06/2026                   │
├────────────────────────────────────────────────────┤
│ Acciones                                            │
│ [Registrar pago manual] [Generar link de pago]     │
│ [Marcar como void]                                 │
├────────────────────────────────────────────────────┤
│ Payments aplicados                                  │
│ ┌────────────────────────────────────────────────┐ │
│ │ 05/06/2026  CASH        APPROVED   ARS 10.000 │ │
│ │ Registrado por recepción                       │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ 10/06/2026  MERCADO_PAGO PENDING  ARS 25.000  │ │
│ │ Preference pref_123                            │ │
│ └────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────┤
│ Conciliación                                        │
│ Provider: Mercado Pago                              │
│ Última referencia: payment_123                      │
│ Estado backend: pendiente                           │
│ Nota: el redirect no confirma pagos.                │
├────────────────────────────────────────────────────┤
│ Auditoría                                           │
│ Creado              01/06/2026 09:00                │
│ Actualizado         10/06/2026 11:20                │
│ Charge ID           charge_123                      │
└────────────────────────────────────────────────────┘
```

Gating:
- `Registrar pago manual`: `billing.canWriteBilling`.
- `Generar link de pago`: `billing.canCreateMercadoPagoPreference` y cargo con saldo abierto.
- Acciones provider-specific se resuelven por registry; el drawer sigue siendo provider-agnostic.
- `403` en cualquier acción queda en toast/error de dominio con `requestId`, sin cerrar el drawer automáticamente.

Estados:
- `loading`: skeleton vertical de secciones.
- `empty payments`: sección "sin pagos aplicados" con CTA manual si tiene permiso.
- `payment pending`: mostrar como estado backend, nunca como pago confirmado.
- `provider unavailable/503`: copy de integración no configurada y link a Integrations si tiene permiso.

---

## 11. Checklist pre-implementación

Antes de tirar el primer prompt master de 5.1:

- [ ] Camilo aprueba este spec o pide ajustes.
- [ ] Confirmar con backend que los endpoints listados están todos UP en `https://bjj-ops-api.onrender.com/api/v1` (no solo en docs).
- [x] Confirmar que el shape real del `billing-summary` y `student-financial-statuses` matchea lo asumido en types (ajustado con shapes confirmados por Camilo).
- [ ] Confirmar con Gonzalo qué endpoints student-self consume Flutter, para evitar duplicar trabajo o esperar shape del backend.
- [x] Agregar wireframe ASCII del `BillingDashboard` y del `ChargeDetailDrawer` antes de código.

---

## 12. Output esperado al cierre de Fase 5

Una academia argentina puede:

1. Definir sus planes (Mensualidad Adultos, Mensualidad Kids, Pack 10 clases, etc.).
2. Asignar plan a cada alumno con fecha de inicio.
3. Emitir cargos manuales o vincularlos a memberships.
4. Registrar pagos manuales (efectivo en recepción, transferencia).
5. Conectar su cuenta de Mercado Pago y generar links de cobro.
6. Ver el estado financiero de cada alumno y del branch agregado.
7. Configurar policy de bloqueo por mora.
8. Auditar webhook events si algo sale raro.
9. Ver dashboard operativo de cobranza.

Todo desde el rol operador, con UI gateada por capabilities, i18n completo, código limpio y arquitectura preparada para sumar Ualá/Modo en Fase 6 o posterior.
