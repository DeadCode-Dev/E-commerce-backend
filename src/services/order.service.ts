import OrdersModel from "../models/orders.model";
import OrderItemsModel from "../models/orderItems.model";
import PaymentsModel from "../models/payments.model";
import ShippingModel from "../models/shipping.model";
import Orders from "../types/order/orders.entity";
import Payments, { PaymentStatus } from "../types/order/payments.entity";
import Shipping from "../types/order/shipping.entity";

export interface CreateOrderData {
  userId: number;
  shippingAddress: Omit<Shipping, "id" | "created_at" | "updated_at">;
  orderItems: Array<{
    product_id: number;
    quantity: number;
  }>;
  payment: Omit<Payments, "id" | "order_id" | "created_at" | "updated_at">;
  total: number;
}

export interface CompleteOrderInfo {
  order: Orders;
  orderItems: Array<{
    id: number;
    product_id: number;
    quantity: number;
    product_name: string;
    product_description: string;
    product_images: string[];
    product_category: string;
  }>;
  payment: Payments;
  shipping: Shipping;
}

export default class OrderService {
  /**
   * Create a complete order with all related entities
   */
  static async createCompleteOrder(
    data: CreateOrderData
  ): Promise<CompleteOrderInfo> {
    try {
      // 1. Create shipping record first
      const shipping = await ShippingModel.createShipping(data.shippingAddress);

      // 2. Create the order
      const order = await OrdersModel.createOrder({
        user_id: data.userId,
        shipping_id: shipping.id,
        total: data.total,
        status: "pending",
      });

      // 3. Create order items
      const orderItemsData = data.orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      await OrderItemsModel.createMultipleOrderItems(orderItemsData);

      // 4. Create payment record
      const payment = await PaymentsModel.createPayment({
        order_id: order.id,
        ...data.payment,
      });

      // 5. Get order items with product details
      const orderItemsWithDetails =
        await OrderItemsModel.getOrderItemsWithProductDetails(order.id);

      return {
        order,
        orderItems: orderItemsWithDetails,
        payment,
        shipping,
      };
    } catch (error) {
      throw new Error(
        `Error creating complete order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get complete order information by order ID
   */
  static async getCompleteOrderById(
    orderId: number
  ): Promise<CompleteOrderInfo | null> {
    try {
      const order = await OrdersModel.findOrderById(orderId);
      if (!order) return null;

      const [orderItems, payment, shipping] = await Promise.all([
        OrderItemsModel.getOrderItemsWithProductDetails(orderId),
        PaymentsModel.findPaymentByOrderId(orderId),
        ShippingModel.findShippingById(order.shipping_id),
      ]);

      if (!payment || !shipping) return null;

      return {
        order,
        orderItems,
        payment,
        shipping,
      };
    } catch (error) {
      throw new Error(
        `Error getting complete order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all orders for a user with basic information
   */
  static async getUserOrders(userId: number): Promise<CompleteOrderInfo[]> {
    try {
      const orders = await OrdersModel.findOrdersByUserId(userId);

      const completeOrders = await Promise.all(
        orders.map(async (order) => {
          const [orderItems, payment, shipping] = await Promise.all([
            OrderItemsModel.getOrderItemsWithProductDetails(order.id),
            PaymentsModel.findPaymentByOrderId(order.id),
            ShippingModel.findShippingById(order.shipping_id),
          ]);

          return {
            order,
            orderItems,
            payment: payment!,
            shipping: shipping!,
          };
        })
      );

      return completeOrders;
    } catch (error) {
      throw new Error(
        `Error getting user orders: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update order status and related entities
   */
  static async updateOrderStatus(
    orderId: number,
    orderStatus: string,
    paymentStatus?: string,
    shippingStatus?: string
  ): Promise<CompleteOrderInfo | null> {
    try {
      // Update order status
      const updatedOrder = await OrdersModel.updateOrderStatus(
        orderId,
        orderStatus
      );
      if (!updatedOrder) return null;

      // Update payment status if provided
      if (paymentStatus) {
        await PaymentsModel.updatePaymentByOrderId(orderId, {
          status: paymentStatus as PaymentStatus,
        });
      }

      // Update shipping status if provided
      if (shippingStatus) {
        await ShippingModel.updateShippingStatus(
          updatedOrder.shipping_id,
          shippingStatus
        );
      }

      // Return complete updated order information
      return await this.getCompleteOrderById(orderId);
    } catch (error) {
      throw new Error(
        `Error updating order status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Cancel an order and update all related statuses
   */
  static async cancelOrder(orderId: number): Promise<boolean> {
    try {
      const order = await OrdersModel.findOrderById(orderId);
      if (!order || order.status === "cancelled") return false;

      await Promise.all([
        OrdersModel.updateOrderStatus(orderId, "cancelled"),
        PaymentsModel.updatePaymentByOrderId(orderId, { status: "failed" }),
        ShippingModel.updateShippingStatus(order.shipping_id, "returned"),
      ]);

      return true;
    } catch (error) {
      throw new Error(
        `Error cancelling order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStatistics(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    try {
      const allOrders = await OrdersModel.getAllOrders();

      const stats = {
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter((order) => order.status === "pending")
          .length,
        completedOrders: allOrders.filter(
          (order) => order.status === "completed"
        ).length,
        cancelledOrders: allOrders.filter(
          (order) => order.status === "cancelled"
        ).length,
        totalRevenue: allOrders
          .filter((order) => order.status === "completed")
          .reduce((sum, order) => sum + order.total, 0),
      };

      return stats;
    } catch (error) {
      throw new Error(
        `Error getting order statistics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
