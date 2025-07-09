import express from "express";
import dotenv from "dotenv";
import corsMiddleware from "../middlewares/cors";
import cookiesParser from "../middlewares/cookiesParser";
import helmetMiddleware from "../middlewares/helmet";
import expressRateLimitMiddleware from "../middlewares/expressRateLimit";
import errorMiddleware from "../middlewares/error";
import authRouter from "../auth/auth.router";
import pool from "../config/postgres";
class Setup {
  public app = express();
  constructor() {}
  init() {
    // Initialization logic for the setup
    this.loadEnvironmentVariables();
    this.configureExpressMiddleware(this.app);
    this.loadDatabase();
    this.Routes();
    this.listen(this.app, parseInt(process.env.PORT || "3000", 10));
    console.log("Setup initialized.");
  }

  loadEnvironmentVariables() {
    dotenv.config();
    console.log("Environment variables loaded.");
  }

  configureExpressMiddleware(app: express.Application) {
    app.use(corsMiddleware());
    app.use(cookiesParser());
    app.use(helmetMiddleware());
    app.use(expressRateLimitMiddleware());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(errorMiddleware);

    // Additional middleware or routes can be added here
    console.log("Express configured with middlewares.");
  }

  loadDatabase() {
    pool.connect((err: any) => {
      if (err) {
        console.error("Database connection error:", err);
      } else {
        console.log("Connected to the database successfully.");
      }
    });
  }

  listen(app: express.Application, port: number) {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
  Routes() {
    this.app.use("/auth", authRouter);
    console.log("Routes configured.");
  }
}
export default new Setup();
