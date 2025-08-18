import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../../../index";
import { createUniqueUserData } from "../../factories/user.factory";

describe("POST /auth/register", () => {
  beforeEach(async () => {
    // Database cleanup happens in setup.ts
    // Add small delay to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("should register a new user successfully", async () => {
    const userData = createUniqueUserData();

    const response = await request(app).post("/auth/register").send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email", userData.email);
    expect(response.body.user).not.toHaveProperty("password");
  });

  it("should return 400 for missing required fields", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      // Missing username and password
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 400 for invalid email format", async () => {
    const userData = {
      ...createUniqueUserData(),
      email: "invalid-email",
    };

    const response = await request(app).post("/auth/register").send(userData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 409 for duplicate email", async () => {
    const userData = createUniqueUserData();

    // Register first user
    const firstResponse = await request(app)
      .post("/auth/register")
      .send(userData);

    expect(firstResponse.status).toBe(201);

    // Try to register with same email
    const response = await request(app).post("/auth/register").send(userData);

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 400 for weak password", async () => {
    const userData = {
      ...createUniqueUserData(),
      password: "123",
    };

    const response = await request(app).post("/auth/register").send(userData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});
