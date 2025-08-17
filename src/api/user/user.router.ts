import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import UserMiddleware from "./user.middleware";
import UserController from "./user.controller";
const userRouter = Router();

userRouter.get("/me", isAuthenticated, UserController.getUser);
userRouter.put(
  "/me",
  isAuthenticated,
  UserMiddleware.updateUser,
  UserController.updateUser,
);
userRouter.delete("/me", isAuthenticated, UserController.deleteUser);

export default userRouter;
