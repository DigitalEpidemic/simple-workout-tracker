// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Target only the setup file (or add test patterns if needed)
    files: ["jest.setup.js"],
    languageOptions: {
      globals: {
        jest: "readonly", // Tell ESLint 'jest' exists and shouldn't be overwritten
      },
    },
  },
  {
    ignores: ["dist/*"],
  },
]);
