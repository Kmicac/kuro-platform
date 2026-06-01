import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Conecta el request config de next-intl (carga de mensajes server-side).
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
