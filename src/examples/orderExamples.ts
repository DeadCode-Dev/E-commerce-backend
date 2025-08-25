import OrderService, { CreateOrderData } from "../services/order.service";
import OrdersModel from "../models/orders.model";
import OrderItemsModel from "../models/orderItems.model";
import PaymentsModel from "../models/payments.model";
import ShippingModel from "../models/shipping.model";

/**
 * Example usage of the Order CRUD models
 * This file demonstrates how to use all the order-related models
 */

// Example: Create a complete order
export async function createOrderExample() {
  try {
    const orderData: CreateOrderData = {
      userId: 1,
      shippingAddress: {
        user_id: 1,
        tracking_number: "",
        address: "123 Main Street",
        city: "Cairo",
        state: "Cairo",
        postal_code: "12345",
        country: "Egypt",
        shipping_status: "pending",
      },
      orderItems: [
        { product_id: 1, quantity: 2 },
        { product_id: 3, quantity: 1 },
      ],
      payment: {
        user_id: 1,
        stripe_payment_id: null,
        amount: "150.00",
        currency: "egp",
        status: "pending",
        payment_method: "cash",
      },
      total: 150.0,
    };

    const completeOrder = await OrderService.createCompleteOrder(orderData);
    console.log("Created complete order:", completeOrder);
    return completeOrder;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

// Example: Get order details
export async function getOrderExample(orderId: number) {
  try {
    const orderDetails = await OrderService.getCompleteOrderById(orderId);
    console.log("Order details:", orderDetails);
    return orderDetails;
  } catch (error) {
    console.error("Error getting order:", error);
    throw error;
  }
}

// Example: Update order status
export async function updateOrderStatusExample(orderId: number) {
  try {
    const updatedOrder = await OrderService.updateOrderStatus(
      orderId,
      "completed",
      "completed",
      "delivered"
    );
    console.log("Updated order:", updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

// Example: Get user orders
export async function getUserOrdersExample(userId: number) {
  try {
    const userOrders = await OrderService.getUserOrders(userId);
    console.log("User orders:", userOrders);
    return userOrders;
  } catch (error) {
    console.error("Error getting user orders:", error);
    throw error;
  }
}

// Example: Individual model operations
export async function individualModelExamples() {
  try {
    // Create a shipping record
    const shipping = await ShippingModel.createShipping({
      user_id: 1,
      tracking_number: "TRACK123456",
      address: "456 Oak Avenue",
      city: "Alexandria",
      state: "Alexandria",
      postal_code: "54321",
      country: "Egypt",
      shipping_status: "pending",
    });
    console.log("Created shipping:", shipping);

    // Create an order
    const order = await OrdersModel.createOrder({
      user_id: 1,
      shipping_id: shipping.id,
      total: 75.5,
      status: "pending",
    });
    console.log("Created order:", order);

    // Create order items
    const orderItems = await OrderItemsModel.createMultipleOrderItems([
      { order_id: order.id, product_id: 2, quantity: 1 },
      { order_id: order.id, product_id: 4, quantity: 3 },
    ]);
    console.log("Created order items:", orderItems);

    // Create payment
    const payment = await PaymentsModel.createPayment({
      order_id: order.id,
      user_id: 1,
      stripe_payment_id: null,
      amount: "75.50",
      currency: "egp",
      status: "pending",
      payment_method: "paymob",
    });
    console.log("Created payment:", payment);

    // Update payment status
    const updatedPayment = await PaymentsModel.updatePaymentStatus(
      payment.id,
      "completed"
    );
    console.log("Updated payment:", updatedPayment);

    // Get order with details
    const orderWithDetails = await OrdersModel.getOrderWithDetails(order.id);
    console.log("Order with details:", orderWithDetails);

    // Get order items with product details
    const orderItemsWithDetails =
      await OrderItemsModel.getOrderItemsWithProductDetails(order.id);
    console.log("Order items with product details:", orderItemsWithDetails);

    return {
      shipping,
      order,
      orderItems,
      payment,
      orderWithDetails,
      orderItemsWithDetails,
    };
  } catch (error) {
    console.error("Error in individual model examples:", error);
    throw error;
  }
}

// Example: Get statistics
export async function getStatisticsExample() {
  try {
    const stats = await OrderService.getOrderStatistics();
    console.log("Order statistics:", stats);
    return stats;
  } catch (error) {
    console.error("Error getting statistics:", error);
    throw error;
  }
}

// Example: Search and filter operations
export async function searchAndFilterExamples() {
  try {
    // Find orders by user
    const userOrders = await OrdersModel.findOrdersByUserId(1);
    console.log("User orders:", userOrders);

    // Get payments by status
    const pendingPayments = await PaymentsModel.getPaymentsByStatus("pending");
    console.log("Pending payments:", pendingPayments);

    // Get shipping by status
    const pendingShipments = await ShippingModel.getShippingByStatus("pending");
    console.log("Pending shipments:", pendingShipments);

    // Find payment by stripe ID
    const stripePayment =
      await PaymentsModel.findPaymentByStripeId("pi_1234567890");
    console.log("Stripe payment:", stripePayment);

    // Find shipping by tracking number
    const trackedShipping =
      await ShippingModel.findShippingByTrackingNumber("TRACK123456");
    console.log("Tracked shipping:", trackedShipping);

    return {
      userOrders,
      pendingPayments,
      pendingShipments,
      stripePayment,
      trackedShipping,
    };
  } catch (error) {
    console.error("Error in search and filter examples:", error);
    throw error;
  }
}

export default {
  createOrderExample,
  getOrderExample,
  updateOrderStatusExample,
  getUserOrdersExample,
  individualModelExamples,
  getStatisticsExample,
  searchAndFilterExamples,
};
