import cors from "cors";
import express from "express";
let application = express.Router();
export default function corsMiddleware() {
  application.use(
    cors({
      origin:
        (((process.env.CORS_ORIGIN as string) + process.env.PORT) as string) ||
        "*", // Allow all origins by default, can be overridden by environment variable
    }),
  );
  console.log("CORS middleware initialized.");
  return application;
}
