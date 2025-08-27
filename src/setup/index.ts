import express from "express";
import corsMiddleware from "../middlewares/cors";
import cookiesParser from "../middlewares/cookiesParser";
import helmetMiddleware from "../middlewares/helmet";
import expressRateLimitMiddleware from "../middlewares/expressRateLimit";
import authRouter from "../api/auth/auth.router";
import pool from "../config/postgres";
import transporter from "../config/nodeMailer";
import SqlInit from "./sql";
import userRouter from "../api/user/user.router";
import imagesRouter from "@/api/images/images.router";
class Setup {
  public app = express();
  constructor() {}
  async init() {
    this.configureExpressMiddleware(this.app);
    this.loadDatabase();
    this.Routes();
    this.checkMailConnection();
    this.listen(this.app, parseInt(process.env.PORT || "3000", 10));
    this.InitSql();
  }

  configureExpressMiddleware(app: express.Application) {
    app.set("trust proxy", 1); // Trust first proxy for secure headers
    app.use(corsMiddleware());
    app.use(cookiesParser());
    app.use(helmetMiddleware());
    app.use(expressRateLimitMiddleware());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    console.log("Express configured with middlewares.");
  }

  loadDatabase() {
    const PostgresClient = pool;
    PostgresClient.connect((err: Error | undefined) => {
      if (err) {
        console.error("Database connection error:", err);
      } else {
        console.log("Connected to the database successfully.");
      }
    });
  }

  checkMailConnection() {
    transporter.verify((error) => {
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
    this.app.use("/user", userRouter);
    this.app.use("/images", imagesRouter);

    console.log("Routes configured.");
  }

  InitSql() {
    if (process.env.firstTime) {
      SqlInit();
    }
  }
}
export default new Setup();
