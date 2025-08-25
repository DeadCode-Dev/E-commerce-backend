import pg from "../config/postgres";
import OrderItems from "../types/order/orderItems.entity";

interface OrderItemWithProductDetails extends OrderItems {
  product_name: string;
  product_description: string;
  product_images: string[];
  product_category: string;
}

export default class OrderItemsModel {
  static db = pg;

  static async createOrderItem(data: Partial<OrderItems>): Promise<OrderItems> {
    const query = `
      INSERT INTO order_items (order_id, product_id, quantity) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const values = [data.order_id, data.product_id, data.quantity];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating order item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findOrderItemById(id: number): Promise<OrderItems | null> {
    const query = `SELECT * FROM order_items WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding order item by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findOrderItemsByOrderId(orderId: number): Promise<OrderItems[]> {
    const query = `SELECT * FROM order_items WHERE order_id = $1`;
    const values = [orderId];

    try {
      const result = await this.db.query(query, values);
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
        p.images as product_images,
        p.category as product_category
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const values = [orderId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting order items with product details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateOrderItem(
    id: number,
    data: Partial<OrderItems>
  ): Promise<OrderItems | null> {
    // Keep only fields with defined values
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof OrderItems] !== undefined &&
        data[key as keyof OrderItems] !== null
    );

    if (dataKeys.length === 0) return null; // nothing to update

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof OrderItems]);
    values.push(id); // for WHERE clause

    const query = `
      UPDATE order_items 
      SET ${setClause} 
      WHERE id = $${dataKeys.length + 1} 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating order item: ${error instanceof Error ? error.message : String(error)}`
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
    const values = [quantity, id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating order item quantity: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteOrderItem(id: number): Promise<void> {
    const query = `DELETE FROM order_items WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting order item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteOrderItemsByOrderId(orderId: number): Promise<void> {
    const query = `DELETE FROM order_items WHERE order_id = $1`;
    const values = [orderId];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting order items by order id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async createMultipleOrderItems(
    orderItems: Partial<OrderItems>[]
  ): Promise<OrderItems[]> {
    if (orderItems.length === 0) return [];

    const valueStrings = orderItems
      .map((_, index) => {
        const offset = index * 3;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      })
      .join(", ");

    const values = orderItems.flatMap((item) => [
      item.order_id,
      item.product_id,
      item.quantity,
    ]);

    const query = `
      INSERT INTO order_items (order_id, product_id, quantity)
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
}
