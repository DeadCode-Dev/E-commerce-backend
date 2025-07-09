import rateLimit from "express-rate-limit";
import express from "express";
const application = express.Router();
export default function expressRateLimitMiddleware() {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: "draft-7", // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  application.use(limiter);
  console.log("Express rate limit middleware initialized.");
  return application;
}
