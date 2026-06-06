import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

// Conecta el request config de next-intl (carga de mensajes server-side).
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Origen del backend de KURO (mismo valor que lib/api/client.ts). Se usa en
// connect-src de la CSP. Derivado de NEXT_PUBLIC_API_URL para no hardcodear
// el host en dos lugares; cae al de producción si la env no está seteada.
const API_ORIGIN = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL ??
        "https://bjj-ops-api.onrender.com/api/v1",
    ).origin;
  } catch {
    return "https://bjj-ops-api.onrender.com";
  }
})();

// Defensa en profundidad. CSP deliberadamente permisiva en V1
// ('unsafe-inline'/'unsafe-eval' los exige Next.js dev + Turbopack HMR);
// endurecer a nonce-based en una fase futura. frame-ancestors 'none' corta
// clickjacking; connect-src habilita backend KURO + Sentry.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${API_ORIGIN} https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

// withSentryConfig envuelve el config para auto-instrumentar y subir source
// maps. El upload solo corre con SENTRY_AUTH_TOKEN + org/project (CI/CD); sin
// esas envs hace build normal sin subir nada. `silent` salvo en CI.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // No subir source maps si no hay token (dev/local) → build no se rompe.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
