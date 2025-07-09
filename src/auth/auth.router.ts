import { Router } from "express";
import AuthController from "./auth.controller";
import { isAuthenticated } from "../middlewares/auth";
import AuthMiddleware from "./auth.middleware";
const authRouter = Router();
authRouter.post(
  "/register",
  AuthMiddleware.validateRegister,
  AuthController.register
);
authRouter.post("/login", AuthMiddleware.validateLogin, AuthController.login);
authRouter.post("/logout", isAuthenticated, AuthController.logout);
authRouter.post("/refresh", isAuthenticated, AuthController.refresh);
export default authRouter;
