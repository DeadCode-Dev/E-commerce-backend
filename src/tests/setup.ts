/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
import { beforeAll, afterAll, beforeEach, jest } from "@jest/globals";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

let pool: any;
let isPoolMocked = false;

beforeAll(async () => {
  process.env.NODE_ENV = "test";

  try {
    // Try to import real pool for integration tests
    pool = require("../config/postgres").default;

    // Test the connection
    await pool.query("SELECT 1");
    console.log("✅ Connected to test database");
    isPoolMocked = false;
  } catch (error) {
    console.warn("⚠️  Database connection failed, using mocks");

    // Mock the database if connection fails
    jest.mock("../config/postgres", () => ({
      default: {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 } as never),
        end: jest.fn().mockResolvedValue(undefined as never),
      },
    }));

    pool = require("../config/postgres").default;
    isPoolMocked = true;
  }
});

beforeEach(async () => {
  if (!isPoolMocked && pool) {
    try {
      // More comprehensive cleanup - order matters due to foreign keys
      await pool.query("TRUNCATE TABLE sessions CASCADE");
      await pool.query("TRUNCATE TABLE users CASCADE");

      // Reset sequences if they exist
      await pool.query("ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1");
      await pool.query(
        "ALTER SEQUENCE IF EXISTS sessions_id_seq RESTART WITH 1",
      );
    } catch (error) {
      console.warn("Database cleanup failed:", error);
    }
  }

  // Clear all mocks
  jest.clearAllMocks();
});

afterAll(async () => {
  if (!isPoolMocked && pool) {
    try {
      // Final cleanup
      await pool.query("TRUNCATE TABLE sessions CASCADE");
      await pool.query("TRUNCATE TABLE users CASCADE");
      await pool.end();
    } catch (error) {
      console.warn("Database close failed:", error);
    }
  }
});
