import js from "@eslint/js";
import globals from "globals";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import tseslintConfig from "@typescript-eslint/eslint-plugin/dist/configs/recommended.js";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.{ts,mts,cts}"],
    plugins: { "@typescript-eslint": tseslintPlugin },
    extends: [tseslintConfig],
  },
]);
