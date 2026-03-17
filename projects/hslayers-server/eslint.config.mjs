import js from "@eslint/js";
import globals from "globals";
import mochaPlugin from "eslint-plugin-mocha";

export default [
  {
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.spec.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
    plugins: {
      mocha: mochaPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...mochaPlugin.configs.recommended.rules,
    },
  },
];
