import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Componentes de cult-ui (registry externo) — no modificar el código
    // de terceros. Las reglas se aplican al código propio en app/, lib/,
    // components/kuro/, components/sessions/, components/shared/, etc.
    "components/ui/grid-beam.tsx",
    "components/ui/side-panel.tsx",
    "components/ui/texture-card.tsx",
  ]),
]);

export default eslintConfig;
