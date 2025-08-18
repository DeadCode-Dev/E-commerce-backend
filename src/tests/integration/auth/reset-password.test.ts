import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import request from "supertest";
import app from "../../../index";
import pool from "../../../config/postgres";
import { createUserData } from "../../factories/user.factory";
import Mailler from "../../../utils/mailler.util";

// Mock the mailer
jest.mock("../../../utils/mailler.util");
const mockedMailler = Mailler as jest.Mocked<typeof Mailler>;

describe("POST /auth/reset-password", () => {
  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE users CASCADE");
    jest.clearAllMocks();
  });

  it("should send OTP for valid email", async () => {
    const userData = createUserData();

    // Register user first
    await request(app).post("/auth/register").send(userData);

    const response = await request(app)
      .post("/auth/reset-password")
      .send({ email: userData.email });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "OTP sent To Email successfully",
    );
    expect(mockedMailler.sendOTP).toHaveBeenCalledWith(
      userData.email,
      expect.any(String),
    );
  });

  it("should return 404 for non-existent user", async () => {
    const response = await request(app)
      .post("/auth/reset-password")
      .send({ email: "nonexistent@example.com" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "User not found");
  });

  it("should return 400 for invalid email format", async () => {
    const response = await request(app)
      .post("/auth/reset-password")
      .send({ email: "invalid-email" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error");
  });

  it("should return 400 for missing email", async () => {
    const response = await request(app).post("/auth/reset-password").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error");
  });
});
