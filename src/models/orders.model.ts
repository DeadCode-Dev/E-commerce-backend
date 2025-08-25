import pg from "../config/postgres";
import Orders from "../types/order/orders.entity";

interface OrderWithDetails extends Orders {
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  tracking_number: string;
  shipping_status: string;
  username: string;
  email: string;
}

export default class OrdersModel {
  static db = pg;

  static async createOrder(data: Partial<Orders>): Promise<Orders> {
    const query = `
      INSERT INTO orders (user_id, shipping_id, total, status) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    const values = [
      data.user_id,
      data.shipping_id,
      data.total,
      data.status || "pending",
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findOrderById(id: number): Promise<Orders | null> {
    const query = `SELECT * FROM orders WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding order by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findOrdersByUserId(userId: number): Promise<Orders[]> {
    const query = `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`;
    const values = [userId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding orders by user id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getAllOrders(): Promise<Orders[]> {
    const query = `SELECT * FROM orders ORDER BY created_at DESC`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting all orders: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateOrder(
    id: number,
    data: Partial<Orders>
  ): Promise<Orders | null> {
    // Keep only fields with defined values
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Orders] !== undefined &&
        data[key as keyof Orders] !== null &&
        data[key as keyof Orders] !== ""
    );

    if (dataKeys.length === 0) return null; // nothing to update

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Orders]);
    values.push(id); // for WHERE clause

    const query = `
      UPDATE orders 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $${dataKeys.length + 1} 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateOrderStatus(
    id: number,
    status: string
  ): Promise<Orders | null> {
    const query = `
      UPDATE orders 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
    const values = [status, id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating order status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteOrder(id: number): Promise<void> {
    const query = `DELETE FROM orders WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getOrderWithDetails(
    id: number
  ): Promise<OrderWithDetails | null> {
    const query = `
      SELECT 
        o.*,
        s.address, s.city, s.state, s.postal_code, s.country, s.tracking_number,
        s.status as shipping_status,
        u.username, u.email
      FROM orders o
      LEFT JOIN shipping s ON o.shipping_id = s.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error getting order with details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
