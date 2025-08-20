import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import * as controller from "./controllers";
import { updateUserSchema } from "./validators/updateUser";
import validate from "@/middlewares/validate";
const userRouter = Router();

userRouter.get("/me", isAuthenticated, controller.getUser);
userRouter.put(
  "/me",
  isAuthenticated,
  validate(updateUserSchema),
  controller.updateUser
);
userRouter.delete("/me", isAuthenticated, controller.deleteUser);

export default userRouter;
