import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../../../index";
import { createUniqueUserData } from "../../factories/user.factory";

describe("POST /auth/login", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userData: any;

  beforeEach(async () => {
    // Add delay to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    userData = createUniqueUserData();

    // Register user first
    const registerResponse = await request(app)
      .post("/auth/register")
      .send(userData);

    expect(registerResponse.status).toBe(201);
  });

  it("should login with valid credentials", async () => {
    const response = await request(app).post("/auth/login").send({
      email: userData.email,
      password: userData.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email", userData.email);
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should return 401 for invalid password", async () => {
    const response = await request(app).post("/auth/login").send({
      email: userData.email,
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 404 for non-existent user", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "nonexistent@example.com",
      password: "password",
    });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 400 for missing email", async () => {
    const response = await request(app).post("/auth/login").send({
      password: "password",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 400 for invalid email format", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "invalid-email",
      password: "password",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});
