import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "@/index";
import pool from "@/config/postgres";
import { createUserData } from "@/tests/factories/user.factory";
import { RegisterType } from "@/api/auth/auth.type";

describe("User Endpoints", () => {
  let authToken: string = "";
  let userData: RegisterType;

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

  describe("GET /user/me", () => {
    it("should get current user", async () => {
      const response = await request(app)
        .get("/user/me")
        .set("Cookie", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("email", userData.email);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app).get("/user/me");

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /user/me", () => {
    it("should update user successfully", async () => {
      const updateData = {
        username: "newusername",
        phone: "+1234567890",
      };

      const response = await request(app)
        .put("/user/me")
        .set("Cookie", authToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User updated successfully"
      );
      expect(response.body.user).toHaveProperty(
        "username",
        updateData.username
      );
      expect(response.body.user).toHaveProperty("phone", updateData.phone);
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .put("/user/me")
        .set("Cookie", authToken)
        .send({
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Validation error");
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app).put("/user/me").send({
        username: "newusername",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /user/me", () => {
    it("should delete user successfully", async () => {
      const response = await request(app)
        .delete("/user/me")
        .set("Cookie", authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User deleted successfully"
      );
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app).delete("/user/me");

      expect(response.status).toBe(401);
    });
  });
});
