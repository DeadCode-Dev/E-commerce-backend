import app from "../../index";
import request from "supertest";
import { describe, it, expect } from "@jest/globals";

describe("POST /auth/login - User usecase", () => {
  it("should return 200 and a token for valid credentials", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "password",
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
  });
  it("should return 401 for invalid password", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "wrongpassword",
    });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("should return 404 for non-existent user", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "nonexistent@example.com",
      password: "password",
    });
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("User not found");
  });

  it("should return 400 for missing email", async () => {
    const response = await request(app).post("/auth/login").send({
      password: "password",
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Validation error");
  });

  it("should return 400 for invalid email format", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "invalid-email",
      password: "password",
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Validation error");
  });

  it("should return 400 for missing password", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Validation error");
  });
});
