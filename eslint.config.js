import { fileURLToPath } from "url";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintPluginImport from "eslint-plugin-import";
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import js from "@eslint/js";
import css from "@eslint/css";
import { includeIgnoreFile } from "@eslint/compat";


// import json from "@eslint/json";
// import markdown from "@eslint/markdown";


export default defineConfig([
  includeIgnoreFile(
    fileURLToPath(new URL(".gitignore", import.meta.url)),
    "Imported .gitignore patterns",
  ),
  {
    ignores: ["package-lock.json", "package.json"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      }
    },
    files: ["**/*.{js,cjs,ts}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      import: eslintPluginImport,
      '@stylistic': stylistic,
    },
    rules: {
      "no-var": "error",
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "prefer-const": "error",
      "@stylistic/indent": ["error", 2],
      "@stylistic/max-len": ["error", { code: 100 }],
      "@stylistic/comma-dangle": ["error", "only-multiline"],
      "@stylistic/arrow-parens": ["error", "as-needed"],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@typescript-eslint/no-empty-object-type": "off",

      // ## Import Rules ##
      "@typescript-eslint/consistent-type-imports": "error", // Enforce 'import type'
      "import/newline-after-import": ["error", {
        count: 2,
        exactCount: true,
        considerComments: true
      }],
      "import/no-useless-path-segments": ["error", {
        noUselessIndex: true
      }],
      "import/prefer-default-export": ["error", { "target": "single" }],
      "import/order": ["error", {
        // 1. Group imports into three main categories.
        groups: [
          ["builtin", "external", "object"], // Group 1: JS built-ins and external libraries
          ["internal", "index", "sibling", "parent"], // Group 2: Internal and relative imports
          "type", // Group 3: Type imports
        ],
        sortTypesGroup: true,
        // Define how @shared should be treated
        pathGroups: [
          {
            pattern: "@shared/**",
            group: "internal",
          }
        ],
        distinctGroup: false,
        // Enforce a single empty line between each of the main groups
        "newlines-between": "always",
        alphabetize: {
          order: "desc", // Forces closest imports to be first
          caseInsensitive: true,
        },
      }],

      // ## Spacing and Padding Rules ##
      "@stylistic/padding-line-between-statements": [
        "error",
        // The new plugin allows types for blanklines
        {
          blankLine: "always",
          prev: "*",
          next: ["class", "function", "interface"],
        },
        {
          blankLine: "always",
          prev: ["class", "function", "interface"],
          next: "*",
        },
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
          selector: ["variable"],
          format: ["camelCase", "UPPER_CASE", "PascalCase"], // Allow UPPER_CASE for constants
          modifiers: ["const"], // Only apply to constants
        },
        {
          selector: ["property"],
          format: ["camelCase", "PascalCase"],
          modifiers: ["readonly"]
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
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
        {
          selector: "import",
          format: null, // No specific format for imports
        },
      ],
    }
  },
  {
    files: ["./src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [{
          "group": ["@shared/**"],
          "message": "Use relative imports ('../**') instead of '@shared/**' aliases."
        }]
      }]
    }
  },
  {
    files: ["eslint.config.js"],
    rules: {
      // Turn off naming convention rules for the config file
      "@typescript-eslint/naming-convention": "off",
    },
  },
  {
    files: ["**/*.spec.ts"],
    languageOptions: {
      globals: { ...globals.jasmine, ...globals.jest },
    }
  },
  // {
  //   files: ["**/*.json"],
  //   plugins: { json },
  //   language: "json/json",
  //   extends: ["json/recommended"],
  // },
  // {
  //   files: ["**/*.md"],
  //   plugins: { markdown },
  //   language: "markdown/gfm",
  //   extends: ["markdown/recommended"],
  // },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
]);
