module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|react-native-chart-kit)",
  ],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "constants/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/coverage/**",
    "!jest.config.js",
    "!jest.setup.js",
  ],
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    // FIX: Map '@/' to <rootDir>/ instead of <rootDir>/src/
    // This allows @/constants to resolve to ./constants and @/src to resolve to ./src
    "^@/(.*)$": "<rootDir>/$1",
  },
};
