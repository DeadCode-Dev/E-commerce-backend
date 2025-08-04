import app from "../../index";
import request from "supertest";
import { describe, it, expect } from "@jest/globals";

describe("POST /auth/refresh", () => {
  it("should refresh token if refresh token is valid", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "password",
    });

    const refreshTokenCookie = loginRes.headers["set-cookie"];

    const response = await request(app)
      .post("/auth/refresh")
      .set("Cookie", refreshTokenCookie); // <-- هنا التعديل الصحيح

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 401 for invalid refresh token", async () => {
    const response = await request(app)
      .post("/auth/refresh")
      .set("Cookie", ["refreshToken=invalidtoken"]);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 401 if refresh token is missing", async () => {
    const response = await request(app).post("/auth/refresh");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
