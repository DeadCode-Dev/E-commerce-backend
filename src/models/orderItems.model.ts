import pg from "../config/postgres";
import OrderItems from "../types/order/orderItems.entity";
import type { PoolClient } from "pg";

interface OrderItemWithProductDetails extends OrderItems {
  product_name: string;
  product_description: string;
  product_images: string[];
  product_category: string;
}

interface OrderItemInput {
  order_id: number;
  product_variant_id: number;
  quantity: number;
  unit_price: number;
}

export default class OrderItemsModel {
  static db = pg;

  private static insertQuery = `
    INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  static async createOrderItem(data: OrderItemInput): Promise<OrderItems> {
    const values = [
      data.order_id,
      data.product_variant_id,
      data.quantity,
      data.unit_price,
    ];

    try {
      const result = await this.db.query(this.insertQuery, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating order item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async createMultipleOrderItems(
    orderId: number,
    orderItems: OrderItemInput[]
  ): Promise<OrderItems[]> {
    if (orderItems.length === 0) return [];

    const valueStrings = orderItems
      .map((_, index) => {
        const offset = index * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      })
      .join(", ");

    const values = orderItems.flatMap((item) => [
      orderId,
      item.product_variant_id,
      item.quantity,
      item.unit_price,
    ]);

    const query = `
      INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price)
      VALUES ${valueStrings}
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error creating multiple order items: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async createMultipleOrderItemsWithClient(
    client: PoolClient,
    orderId: number,
    orderItems: OrderItemInput[]
  ): Promise<OrderItems[]> {
    if (orderItems.length === 0) return [];

    const valueStrings = orderItems
      .map((_, index) => {
        const offset = index * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      })
      .join(", ");

    const values = orderItems.flatMap((item) => [
      orderId,
      item.product_variant_id,
      item.quantity,
      item.unit_price,
    ]);

    const query = `
      INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price)
      VALUES ${valueStrings}
      RETURNING *
    `;

    try {
      const result = await client.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error creating multiple order items: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findOrderItemById(id: number): Promise<OrderItems | null> {
    const query = `SELECT * FROM order_items WHERE id = $1`;

    try {
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding order item by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findOrderItemsByOrderId(orderId: number): Promise<OrderItems[]> {
    const query = `SELECT * FROM order_items WHERE order_id = $1`;

    try {
      const result = await this.db.query(query, [orderId]);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding order items by order id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getOrderItemsWithProductDetails(
    orderId: number
  ): Promise<OrderItemWithProductDetails[]> {
    const query = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.description as product_description,
        ARRAY(SELECT image_url FROM image WHERE product_id = p.id ORDER BY display_order) as product_images
      FROM order_items oi
      LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = $1
    `;

    try {
      const result = await this.db.query(query, [orderId]);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting order items with product details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateOrderItemQuantity(
    id: number,
    quantity: number
  ): Promise<OrderItems | null> {
    const query = `
      UPDATE order_items 
      SET quantity = $1 
      WHERE id = $2 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, [quantity, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating order item quantity: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteOrderItem(id: number): Promise<void> {
    const query = `DELETE FROM order_items WHERE id = $1`;

    try {
      await this.db.query(query, [id]);
    } catch (error) {
      throw new Error(
        `Error deleting order item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteOrderItemsByOrderId(orderId: number): Promise<void> {
    const query = `DELETE FROM order_items WHERE order_id = $1`;

    try {
      await this.db.query(query, [orderId]);
    } catch (error) {
      throw new Error(
        `Error deleting order items by order id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
