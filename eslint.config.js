import { fileURLToPath } from "url";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintPluginImport from "eslint-plugin-import";
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import js from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";
import angularTemplateParser from "@angular-eslint/template-parser";
import angularEslintTemplate from "@angular-eslint/eslint-plugin-template";
import angularEslintPlugin from "@angular-eslint/eslint-plugin";


export default defineConfig([
  includeIgnoreFile(
    fileURLToPath(new URL(".gitignore", import.meta.url)),
    "Imported .gitignore patterns",
  ),

  {
    ignores: ["package-lock.json", "package.json", "jest.config.cjs"],
  },

  // JS recommended (JS only) — no spreading
  { files: ["**/*.{js,mjs,cjs}"], ...js.configs.recommended },

  // TypeScript base recommended (scoped to TS files only)
  // Adds TS plugin + rules for *.ts without requiring parserOptions.project
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["**/*.ts"],
  })),

  // Angular template HTML files
  {
    files: ["src/client/**/*.html"],
    languageOptions: { parser: angularTemplateParser },
    plugins: { "@angular-eslint/template": angularEslintTemplate },
    rules: {
      "@angular-eslint/template/banana-in-box": "error",
      "@angular-eslint/template/no-negated-async": "error",
      "@angular-eslint/template/use-track-by-function": "warn",
    }
  },

  // Common rules for JS + TS that do NOT require TS type info
  {
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      }
    },
    files: ["**/*.{js,mjs,cjs,ts}"],
    ignores: ["**/*.html", "**/*.css", "**/*.scss"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      import: eslintPluginImport,
      "@stylistic": stylistic,
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "@stylistic/indent": ["error", 2],
      "@stylistic/max-len": ["error", { code: 100 }],
      "@stylistic/comma-dangle": ["error", "only-multiline"],
      "@stylistic/arrow-parens": ["error", "as-needed"],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/eol-last": ["error", "always"],

      // Import Rules (safe without TS type info)
      "import/newline-after-import": [
        "error", 
        { 
          count: 2, 
          exactCount: true, 
          considerComments: true 
        }
      ],
      "import/no-useless-path-segments": [
        "error", 
        { noUselessIndex: true }
      ],
      "import/prefer-default-export": [
        "error", 
        { target: "single" }
      ],
      "import/order": [
        "error", 
        {
          groups: [
            ["builtin", "external", "object"],
            ["internal", "index", "sibling", "parent"],
            "type",
          ],
          sortTypesGroup: true,
          pathGroups: [{ 
            pattern: "@shared/**", 
            group: "internal" 
          }],
          distinctGroup: false,
          "newlines-between": "always",
          alphabetize: { 
            order: "desc", 
            caseInsensitive: true 
          },
        }
      ],
    }
  },

  // TS typed rules (use project service to auto-discover tsconfigs)
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
      },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        { 
          selector: "default", 
          format: ["camelCase"] 
        },
        { 
          selector: ["variable", "parameter", "function", "method"], 
          format: ["camelCase"], 
          leadingUnderscore: "allow" 
        },
        { 
          selector: ["variable"], 
          format: ["camelCase", "UPPER_CASE", "PascalCase"], 
          modifiers: ["const"] 
        },
        { 
          selector: ["property", "parameterProperty", "classicAccessor"], 
          format: ["camelCase", "PascalCase"], 
          leadingUnderscore: "allow" 
        },
        { 
          selector: "property", 
          modifiers: ["static"], 
          format: ["camelCase", "UPPER_CASE"] 
        },
        { 
          selector: "enumMember", 
          format: ["UPPER_CASE"] 
        },
        { 
          selector: "objectLiteralProperty", 
          format: ["camelCase", "UPPER_CASE"], 
          modifiers: ["requiresQuotes"] 
        },
        { 
          selector: ["typeLike", "class", "interface", "enum", "typeAlias"], 
          format: ["PascalCase"] 
        },
        { 
          selector: "import", 
          format: null 
        },
      ],
    }
  },

  {
    files: ["./src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error", 
        {
          patterns: [{
            group: ["@shared/**"],
            message: "Use relative imports ('../**') instead of '@shared/**' aliases."
          }]
        }
      ]
    }
  },

  // Allow JS config file to skip TS naming rule if it ever applies
  {
    files: ["eslint.config.js"],
    rules: {
      "@typescript-eslint/naming-convention": "off"
    },
  },
  {
    files: ["**/*.spec.ts"],
    languageOptions: {
      globals: { ...globals.jasmine, ...globals.jest },
    }
  },
  // Angular client TypeScript files
  {
    files: ["src/client/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
        sourceType: "module",
      },
    },
    plugins: { "@angular-eslint": angularEslintPlugin },
    rules: {
      "@angular-eslint/directive-selector": [
        "error", 
        { 
          type: "attribute", 
          prefix: "app", 
          style: "camelCase" 
        }
      ],
      "@angular-eslint/component-selector": [
        "error", 
        { 
          type: "element", 
          prefix: "app", 
          style: "kebab-case" 
        }
      ],
      "@angular-eslint/no-empty-lifecycle-method": "error",
      "@angular-eslint/use-lifecycle-interface": "error",
    }
  },

  // Angular client TypeScript files
  {
    files: ["src/client/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
        sourceType: "module",
      },
    },
    plugins: { "@angular-eslint": angularEslintPlugin },
    rules: {
      // Allow DI without forcing type-only import style
      "@typescript-eslint/consistent-type-imports": ["off"],
    },
  },

  // CSS/SCSS linting is handled by Stylelint (see .stylelintrc.json)
]);
