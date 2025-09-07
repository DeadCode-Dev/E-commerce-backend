import pg from "../config/postgres";
import Payments, {
  PaymentStatus,
  PaymentMethodType,
} from "../types/order/payments.entity";

export default class PaymentsModel {
  static db = pg;

  static async createPayment(data: Partial<Payments>): Promise<Payments> {
    const query = `
      INSERT INTO payments (order_id, user_id, stripe_payment_id, amount, currency, status, payment_method) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    const values = [
      data.order_id,
      data.user_id,
      data.stripe_payment_id,
      data.amount,
      data.currency || "egp",
      data.status || "pending",
      data.payment_method || "cash",
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findPaymentById(id: number): Promise<Payments | null> {
    const query = `SELECT * FROM payments WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding payment by id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findPaymentByOrderId(orderId: number): Promise<Payments | null> {
    const query = `SELECT * FROM payments WHERE order_id = $1`;
    const values = [orderId];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding payment by order id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findPaymentsByUserId(userId: number): Promise<Payments[]> {
    const query = `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`;
    const values = [userId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding payments by user id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findPaymentByStripeId(
    stripePaymentId: string,
  ): Promise<Payments | null> {
    const query = `SELECT * FROM payments WHERE stripe_payment_id = $1`;
    const values = [stripePaymentId];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding payment by stripe id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getAllPayments(): Promise<Payments[]> {
    const query = `SELECT * FROM payments ORDER BY created_at DESC`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting all payments: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async updatePayment(
    id: number,
    data: Partial<Payments>,
  ): Promise<Payments | null> {
    // Keep only fields with defined values
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Payments] !== undefined &&
        data[key as keyof Payments] !== null &&
        data[key as keyof Payments] !== "",
    );

    if (dataKeys.length === 0) return null; // nothing to update

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Payments]);
    values.push(id); // for WHERE clause

    const query = `
      UPDATE payments 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $${dataKeys.length + 1} 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async updatePaymentStatus(
    id: number,
    status: PaymentStatus,
  ): Promise<Payments | null> {
    const query = `
      UPDATE payments 
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
        `Error updating payment status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async updatePaymentByOrderId(
    orderId: number,
    data: Partial<Payments>,
  ): Promise<Payments | null> {
    // Keep only fields with defined values
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Payments] !== undefined &&
        data[key as keyof Payments] !== null &&
        data[key as keyof Payments] !== "",
    );

    if (dataKeys.length === 0) return null; // nothing to update

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Payments]);
    values.push(orderId); // for WHERE clause

    const query = `
      UPDATE payments 
      SET ${setClause}, updated_at = NOW() 
      WHERE order_id = $${dataKeys.length + 1} 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating payment by order id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async deletePayment(id: number): Promise<void> {
    const query = `DELETE FROM payments WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting payment: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getPaymentsByStatus(status: PaymentStatus): Promise<Payments[]> {
    const query = `SELECT * FROM payments WHERE status = $1 ORDER BY created_at DESC`;
    const values = [status];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting payments by status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getPaymentsByMethod(
    paymentMethod: PaymentMethodType,
  ): Promise<Payments[]> {
    const query = `SELECT * FROM payments WHERE payment_method = $1 ORDER BY created_at DESC`;
    const values = [paymentMethod];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting payments by method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
