import { Router } from "express";
import { isAuthenticated } from "@/middlewares/auth";
import createOrder from "./controllers/createOrder";
import getOrders from "./controllers/getOrders";

const router = Router();

// All order routes require authentication
router.use(isAuthenticated);

router.post("/", createOrder);
router.get("/", getOrders);

export default router;
