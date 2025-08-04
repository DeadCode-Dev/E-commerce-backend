import app from "../../index";
import request from "supertest";
import { describe, it, expect } from "@jest/globals";
import { generateRandomUser } from "../../utils/random.util";

describe("POST /auth/register - User Registration", () => {
  it("should return 200 for successful registration", async () => {
    const user = generateRandomUser();
    const response = await request(app).post("/auth/register").send({
      username: user.username,
      email: user.email,
      password: user.password,
      phone: user.phone,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "User registered successfully",
    );
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("id");
  });

  it("should return 400 for duplicate email", async () => {
    const user = generateRandomUser();

    // First registration
    await request(app).post("/auth/register").send(user);

    // Second registration with same email
    const response = await request(app)
      .post("/auth/register")
      .send({
        ...generateRandomUser(),
        email: user.email, // duplicate
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "User already exists");
  });

  it("should return 400 for missing email", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "Test User",
      password: "password123",
      phone: "0100000000",
      address: "Test Address",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error");
  });

  it("should return 400 for invalid email format", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "Test User",
      email: "invalid-email",
      password: "password123",
      phone: "0100000000",
      address: "Test Address",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error");
  });

  it("should return 400 for missing password", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "Test User",
      email: "test@example.com",
      phone: "0100000000",
      address: "Test Address",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error");
  });

  it("should return 400 for missing name", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      phone: "0100000000",
      address: "Test Address",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error");
  });

  it("should return 400 for missing phone", async () => {
    const response = await request(app).post("/auth/register").send({
      username: "Test User",
      email: "test@example.com",
      password: "password123",
      address: "Test Address",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error");
  });
});
