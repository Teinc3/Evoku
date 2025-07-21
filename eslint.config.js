import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      js,
      import: eslintPluginImport,
    },
    rules: {
      "no-var": "error", // Disallow 'var'
      "prefer-const": "error", // Enforce 'const' for non-reassigned variables

      // ## Import Rules ##
      "@typescript-eslint/consistent-type-imports": "error", // Enforce 'import type'
      "import/no-restricted-paths": [
        // Disallow '@shared' alias within the shared directory
        "error",
        {
          zones: [
            {
              target: "./src/shared", // The directory where the rule applies
              from: "./src/shared", // The source of imports to restrict
              message:
                "Use relative imports ('./' or '../') within the 'src/shared' directory.",
            },
          ],
        },
      ],

      "import/order": [
        "error",
        {
          // 1. Group imports into three main categories.
          groups: [
            ["builtin", "external"], // Group 1: Node.js built-ins and external libraries
            "internal", // Group 2: Internal modules (@shared)
            ["parent", "sibling", "index", "object"], // Group 3: Relative imports
            "type", // Group 4: Type imports
          ],
          // Define how @shared should be treated
          pathGroups: [
            {
              pattern: "@shared/**",
              group: "internal",
            },
          ],
          // Enforce a single empty line between each of the main groups
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // ## Spacing and Padding Rules ##
      "padding-line-between-statements": [
        "error",
        // Always require a blank line after the import block
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },

        // 2. Enforce blank lines between top-level constructs (quite confusing so comment out for now)
        /* {
          blankLine: "always",
          prev: "*",
          next: ["class", "function", "type"],
        },
        {
          blankLine: "always",
          prev: ["class", "function", "type"],
          next: "*",
        },

        // Allow any number of lines between two export statements
        { blankLine: "any", prev: "export", next: "export" }, */
      ],

      // ## Naming Convention Rules ##
      "@typescript-eslint/naming-convention": [
        "error",
        // Default for variables and properties is camelCase
        {
          selector: "default",
          format: ["camelCase"],
        },
        {
          selector: ["variable", "parameter", "property", "function", "method"],
          format: ["camelCase"],
          leadingUnderscore: "allow", // Allow leading underscore for private variables
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"], // Allow UPPER_CASE for constants
          modifiers: ["const"], // Only apply to constants
        },
        {
          selector: "objectLiteralProperty",
          format: ["camelCase", "UPPER_CASE"],
          modifiers: ["requiresQuotes"],
        },
        // Enforce PascalCase for classes, interfaces, enums, etc.
        {
          selector: ["typeLike", "class", "interface", "enum", "typeAlias"],
          format: ["PascalCase"],
        },
      ],
    },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  tseslint.configs.recommended,
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
  eslintConfigPrettier,
]);
