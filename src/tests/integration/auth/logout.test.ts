import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../../../index";
import { createUserData } from "../../factories/user.factory";

describe("POST /auth/logout", () => {
  let authToken: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userData: any;

  beforeEach(async () => {
    userData = createUserData();

    // Register and login user
    await request(app).post("/auth/register").send(userData);

    const loginResponse = await request(app).post("/auth/login").send({
      email: userData.email,
      password: userData.password,
    });

    authToken = loginResponse.headers["set-cookie"];
  });

  it("should logout successfully", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .set("Cookie", authToken);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 401 for unauthenticated request", async () => {
    const response = await request(app).post("/auth/logout");

    expect(response.status).toBe(401);
  });

  it("should return 401 for invalid token", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .set("Cookie", ["accessToken=invalidtoken"]);

    expect(response.status).toBe(401);
  });
});
