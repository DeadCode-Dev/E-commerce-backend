import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^shared/(.*)$": "<rootDir>/src/shared/$1",
    "^types/(.*)$": "<rootDir>/src/types/$1",
    "^utils/(.*)$": "<rootDir>/src/utils/$1",
    "^config/(.*)$": "<rootDir>/src/config/$1",
    "^api/(.*)$": "<rootDir>/src/api/$1",
    "^middlewares/(.*)$": "<rootDir>/src/middlewares/$1",
  },
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.spec.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/tests/**",
    "!src/index.ts",
    "!src/setup/**",
    "!src/sql/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  testTimeout: 30000, // Increased timeout
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Isolate each test file
};

export default config;
