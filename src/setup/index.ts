import express from "express";
import dotenv from "dotenv";
import corsMiddleware from "../middlewares/cors";
import cookiesParser from "../middlewares/cookiesParser";
import helmetMiddleware from "../middlewares/helmet";
import expressRateLimitMiddleware from "../middlewares/expressRateLimit";
import authRouter from "../api/auth/auth.router";
import pool from "../config/postgres";
import transporter from "../config/nodeMailer";
class Setup {
  public app = express();
  constructor() {}
  async init() {
    this.loadEnvironmentVariables()
      .then(() => {
        this.configureExpressMiddleware(this.app);
        this.loadDatabase();
        this.Routes();
        this.checkMailConnection();
        this.listen(this.app, parseInt(process.env.PORT || "3000", 10));
      })
      .catch((error) => {
        console.error("Error during setup initialization:", error);
      });
  }

  loadEnvironmentVariables() {
    return new Promise((resolve, reject) => {
      const result = dotenv.config();
      if (result.error) {
        console.error("Error loading .env file:", result.error);
        reject(result.error);
      } else {
        console.log("Environment variables loaded successfully.");
        resolve(result);
      }
    });
  }

  configureExpressMiddleware(app: express.Application) {
    app.use(corsMiddleware());
    app.use(cookiesParser());
    app.use(helmetMiddleware());
    app.use(expressRateLimitMiddleware());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    console.log("Express configured with middlewares.");
  }

  loadDatabase() {
    const PostgresCleint = pool();
    PostgresCleint.connect((err: Error | undefined) => {
      if (err) {
        console.error("Database connection error:", err);
      } else {
        console.log("Connected to the database successfully.");
      }
    });
  }

  checkMailConnection() {
    const nodeMailerClient = transporter();
    nodeMailerClient.verify((error) => {
      if (error) {
        console.error("Error in mail configuration:", error);
      } else {
        console.log("Mail configuration is ready to send messages.");
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
