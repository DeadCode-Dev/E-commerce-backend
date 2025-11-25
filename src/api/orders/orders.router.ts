import { Router } from "express";
import { isAuthenticated } from "@/middlewares/auth";
import validate from "@/middlewares/validate";

// Order Controllers
import createOrder from "./controllers/createOrder";
import getOrders from "./controllers/getOrders";
import getOrderById from "./controllers/getOrderById";
import updateOrderStatus from "./controllers/updateOrderStatus";
import deleteOrder from "./controllers/deleteOrder";
import trackOrder from "./controllers/trackOrder";
import getOrdersByEmail from "./controllers/getOrdersByEmail";
import updateShippingStatus from "./controllers/updateShippingStatus";

// Payment Controllers
import getPayments from "./controllers/getPayments";
import getPaymentByOrderId from "./controllers/getPaymentByOrderId";
import getPaymentDetails from "./controllers/getPaymentDetails";
import getPaymentStats from "./controllers/getPaymentStats";
import markPaymentPaid from "./controllers/markPaymentPaid";
import markPaymentUnpaid from "./controllers/markPaymentUnpaid";

// Validations
import {
  createOrderSchema,
  updateOrderStatusSchema,
  getOrderByIdSchema,
  deleteOrderSchema,
  trackOrderSchema,
  getOrdersByEmailSchema,
  updateShippingStatusSchema,
  getPaymentByOrderIdSchema,
  paymentIdSchema,
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

// ==================== Payment Routes (Admin) ====================

// Get all payments with optional filtering (?is_paid=true/false)
router.get("/payments/all", isAuthenticated, getPayments);

// Get payment stats (totals, counts)
router.get("/payments/stats", isAuthenticated, getPaymentStats);

// Get payment by order ID
router.get(
  "/payments/order/:orderId",
  isAuthenticated,
  validate(getPaymentByOrderIdSchema),
  getPaymentByOrderId
);

// Get payment details with customer info
router.get(
  "/payments/:id",
  isAuthenticated,
  validate(paymentIdSchema),
  getPaymentDetails
);

// Mark payment as paid (Cash on Delivery collected)
router.patch(
  "/payments/:id/paid",
  isAuthenticated,
  validate(paymentIdSchema),
  markPaymentPaid
);

// Mark payment as unpaid (refund/cancel)
router.patch(
  "/payments/:id/unpaid",
  isAuthenticated,
  validate(paymentIdSchema),
  markPaymentUnpaid
);

export default router;
