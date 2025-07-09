import cookieParser from "cookie-parser";
import express from "express";
let application = express.Router();
// Middleware to parse cookies

export default function cookiesParser() {
  application.use(cookieParser(process.env.Cookie_SECRET));
  console.log("Cookies parser middleware initialized.");
  return application;
}
