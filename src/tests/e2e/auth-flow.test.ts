import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../../index";
import { createUniqueUserData } from "../factories/user.factory";

describe("Complete Auth Flow E2E", () => {
  beforeEach(async () => {
    // Ensure clean state with longer delay
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it("should complete full user registration, login, and logout flow", async () => {
    const userData = createUniqueUserData();

    // 1. Register user
    const registerResponse = await request(app)
      .post("/auth/register")
      .send(userData);

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user).toHaveProperty("email", userData.email);

    // Small delay between operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 2. Login user
    const loginResponse = await request(app).post("/auth/login").send({
      email: userData.email,
      password: userData.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("user");

    const authToken = loginResponse.headers["set-cookie"];

    // 3. Access protected route
    const userResponse = await request(app)
      .get("/user/me")
      .set("Cookie", authToken);

    expect(userResponse.status).toBe(200);
    expect(userResponse.body.user).toHaveProperty("email", userData.email);

    // 4. Logout
    const logoutResponse = await request(app)
      .post("/auth/logout")
      .set("Cookie", authToken);

    expect(logoutResponse.status).toBe(200);

    // 5. Try to access protected route after logout
    const protectedResponse = await request(app)
      .get("/user/me")
      .set("Cookie", authToken);

    expect(protectedResponse.status).toBe(401);
  });
});
