// tests/auth/logout.test.ts
import app from "../../index";
import request from "supertest";
import { describe, it, expect } from "@jest/globals";

describe("POST /auth/logout", () => {
  it("should logout user and return 200", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "password",
    });

    const token = loginRes.headers["set-cookie"];

    const response = await request(app)
      .post("/auth/logout")
      .set("cookie", token);
    console.log(response.status, response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Logged out successfully");
  });

  it("should return 401 if token is invalid", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer invalidtoken`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid credentials");
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).post("/auth/logout");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid credentials");
  });
});
