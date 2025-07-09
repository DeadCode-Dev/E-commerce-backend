import helmet from "helmet";
import express from "express";
const application = express.Router();

export default function helmetMiddleware() {
  application.use(helmet());
  console.log("Helmet middleware initialized.");
  return application;
}
