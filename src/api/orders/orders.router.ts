import { Router } from "express";
import { isAuthenticated } from "@/middlewares/auth";
import validate from "@/middlewares/validate";

// Controllers
import createOrder from "./controllers/createOrder";
import getOrders from "./controllers/getOrders";
import getOrderById from "./controllers/getOrderById";
import updateOrderStatus from "./controllers/updateOrderStatus";
import deleteOrder from "./controllers/deleteOrder";
import trackOrder from "./controllers/trackOrder";
import getOrdersByEmail from "./controllers/getOrdersByEmail";
import updateShippingStatus from "./controllers/updateShippingStatus";

// Validations
import {
  createOrderSchema,
  updateOrderStatusSchema,
  getOrderByIdSchema,
  deleteOrderSchema,
  trackOrderSchema,
  getOrdersByEmailSchema,
  updateShippingStatusSchema,
} from "./validations/orders";

const router = Router();

// ==================== Public Routes ====================

// Guest checkout - create order without authentication
router.post("/", validate(createOrderSchema), createOrder);

// Track order by tracking number (public)
router.get("/track/:tracking_number", validate(trackOrderSchema), trackOrder);

// Get orders by email (for guest customers to view their orders)
router.get("/by-email", validate(getOrdersByEmailSchema), getOrdersByEmail);

// ==================== Protected Routes ====================

// Get all orders (admin)
router.get("/", isAuthenticated, getOrders);

// Get single order by ID
router.get("/:id", isAuthenticated, validate(getOrderByIdSchema), getOrderById);

// Update order status (admin)
router.patch(
  "/:id/status",
  isAuthenticated,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

// Delete order (admin)
router.delete(
  "/:id",
  isAuthenticated,
  validate(deleteOrderSchema),
  deleteOrder
);

// Update shipping status/tracking (admin)
router.patch(
  "/shipping/:id",
  isAuthenticated,
  validate(updateShippingStatusSchema),
  updateShippingStatus
);

export default router;
