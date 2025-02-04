// @ts-check
import globals from "globals";
import angularEslint from "angular-eslint";
import typescriptEslint from "typescript-eslint";
import tsdoc from "eslint-plugin-tsdoc";
import olEslint from "eslint-config-openlayers";
import { fixupPluginRules } from "@eslint/compat";


export default typescriptEslint.config({
    languageOptions: {
        globals: {
            ...globals.browser,
        },
    },
}, {
    files: ["**/*.ts"],
    extends: [
        ...olEslint,
        typescriptEslint.configs.eslintRecommended,
        typescriptEslint.configs.recommended,
        angularEslint.configs.tsRecommended,
    ],
    processor: angularEslint.processInlineTemplates,
    plugins: {
        "@typescript-eslint": typescriptEslint.plugin,
        "@angular-eslint": angularEslint.tsPlugin,
        "tsdoc": fixupPluginRules(tsdoc),
    },
    languageOptions: {
        parser: typescriptEslint.parser,
        ecmaVersion: 2018,
        sourceType: "script",
    },
    settings: {
        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
            },
            node: {
                extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
            },
        },
        jsdoc: {
            tagNamePreference: {
                returns: "returns",
            },
        },
    },
    rules: {
        "@angular-eslint/directive-selector": ["error", {
            type: "attribute",
            prefix: "hs",
            style: "camelCase",
        }],
        "@angular-eslint/component-selector": ["error", {
            type: "element",
            prefix: ["hs", "hslayers"],
            style: "kebab-case",
        }],
        "@angular-eslint/prefer-standalone": "warn",
        "brace-style": "warn",
        "no-console": "warn",
        "object-curly-spacing": "warn",
        "prefer-arrow-callback": "warn",
        "space-before-function-paren": "off",
        "import/order": "off",
        "import/no-duplicates": "warn",
        "import/extensions": ["error", "ignorePackages", {
            js: "never",
            ts: "never",
        }],
        "@typescript-eslint/no-empty-function": ["error", {
            allow: ["constructors"],
        }],
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "valid-jsdoc": "off",
        "jsdoc/require-returns-type": "off",
        "jsdoc/require-hyphen-before-param-description": "off",
        "jsdoc/require-param": "warn",
        "jsdoc/require-param-type": "off",
        "jsdoc/require-returns": 'warn',
        "jsdoc/require-returns-check": "warn",
        "tsdoc/syntax": "warn",
    },
}, {
    files: ["**/*.html"],
    extends: [
        ...angularEslint.configs.templateRecommended,
        ...angularEslint.configs.templateAccessibility,
    ],
    /*plugins: {
        "@angular-eslint/template": angularEslintTemplate,
    },
    languageOptions: {
        parser: angularEslintParser,
    },*/
    rules: {
        "@angular-eslint/template/interactive-supports-focus": "warn",
        "@angular-eslint/template/click-events-have-key-events": "warn",
        "@angular-eslint/template/elements-content": "warn",
    },
}, {
    files: ["**/*.spec.ts"],
    languageOptions: {
        globals: {
            ...globals.jasmine,
        },
    },
});
