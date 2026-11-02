import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", ".next.locked-*/**", ".vercel/**", "node_modules/**", ".npm-cache/**"]
  }
];

export default eslintConfig;

