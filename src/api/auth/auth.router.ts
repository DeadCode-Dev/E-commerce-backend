import { Router } from "express";
import validate from "@/middlewares/validate";
import * as controllers from "./controllers";
import { loginSchema } from "./validation/login";
import { registerSchema } from "./validation/register";
import { forgotPasswordResetSchema } from "./validation/forgotPasswordResetSchema";
import { resetPasswordSchema } from "./validation/resetPassword";
import { verifyOTPSchema } from "./validation/verifyOTP";
import { isAuthenticated } from "@/middlewares/auth";
import { changePasswordSchema } from "./validation/changePassword";
const router = Router();

router.post("/login", validate(loginSchema), controllers.login);
router.post("/register", validate(registerSchema), controllers.register);

// password
router.post(
  "/password/change",
  isAuthenticated,
  validate(changePasswordSchema),
  controllers.changePassword
);
router.post(
  "/password/verify-otp",
  validate(verifyOTPSchema),
  controllers.verifyOTP
);
router.post(
  "/password/forgot",
  validate(resetPasswordSchema),
  controllers.sendPasswordResetOTP
);
router.post(
  "/password/reset",
  validate(forgotPasswordResetSchema),
  controllers.resetPassword
);

export default router;
