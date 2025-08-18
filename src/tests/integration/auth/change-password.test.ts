import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../../../index";
import pool from "../../../config/postgres";
import { createUserData } from "../../factories/user.factory";

describe("POST /auth/change-password", () => {
  let authToken: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userData: any;

  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE users CASCADE");

    userData = createUserData();

    // Register and login user
    await request(app).post("/auth/register").send(userData);

    const loginResponse = await request(app).post("/auth/login").send({
      email: userData.email,
      password: userData.password,
    });

    authToken = loginResponse.headers["set-cookie"];
  });

  it("should change password successfully", async () => {
    const newPassword = "newpassword123";

    const response = await request(app)
      .post("/auth/change-password")
      .set("Cookie", authToken)
      .send({
        oldPassword: userData.password,
        newPassword: newPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Password changed successfully",
    );
  });

  it("should return 401 for incorrect old password", async () => {
    const response = await request(app)
      .post("/auth/change-password")
      .set("Cookie", authToken)
      .send({
        oldPassword: "wrongpassword",
        newPassword: "newpassword123",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "password is incorrect");
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await request(app).post("/auth/change-password").send({
      oldPassword: userData.password,
      newPassword: "newpassword123",
    });

    expect(response.status).toBe(401);
  });

  it("should return 400 for validation errors", async () => {
    const response = await request(app)
      .post("/auth/change-password")
      .set("Cookie", authToken)
      .send({
        oldPassword: "123", // Too short
        newPassword: "456", // Too short
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation error");
  });
});
