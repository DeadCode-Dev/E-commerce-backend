import pg from "../config/postgres";
import type { PoolClient } from "pg";
import Payments from "../types/order/payments.entity";

export default class PaymentsModel {
  static db = pg;

  private static insertQuery = `
    INSERT INTO payments (order_id, amount, currency, is_paid)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  static async createPayment(data: Partial<Payments>): Promise<Payments> {
    const values = [
      data.order_id,
      data.amount,
      data.currency || "egp",
      data.is_paid || false,
    ];

    try {
      const result = await this.db.query(this.insertQuery, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating payment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async createPaymentWithClient(
    client: PoolClient,
    data: Partial<Payments>
  ): Promise<Payments> {
    const values = [
      data.order_id,
      data.amount,
      data.currency || "egp",
      data.is_paid || false,
    ];

    try {
      const result = await client.query(this.insertQuery, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating payment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findPaymentById(id: number): Promise<Payments | null> {
    const query = `SELECT * FROM payments WHERE id = $1`;

    try {
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding payment by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findPaymentByOrderId(orderId: number): Promise<Payments | null> {
    const query = `SELECT * FROM payments WHERE order_id = $1`;

    try {
      const result = await this.db.query(query, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding payment by order id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getAllPayments(
    limit = 50,
    offset = 0
  ): Promise<{ data: Payments[]; total: number }> {
    const [dataR, countR] = await Promise.all([
      this.db.query(
        `SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      this.db.query(`SELECT COUNT(*)::int AS total FROM payments`),
    ]);
    return { data: dataR.rows, total: countR.rows[0].total };
  }

  static async getPaidPayments(
    limit = 50,
    offset = 0
  ): Promise<{ data: Payments[]; total: number }> {
    const [dataR, countR] = await Promise.all([
      this.db.query(
        `SELECT * FROM payments WHERE is_paid = TRUE ORDER BY paid_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total FROM payments WHERE is_paid = TRUE`
      ),
    ]);
    return { data: dataR.rows, total: countR.rows[0].total };
  }

  static async getUnpaidPayments(
    limit = 50,
    offset = 0
  ): Promise<{ data: Payments[]; total: number }> {
    const [dataR, countR] = await Promise.all([
      this.db.query(
        `SELECT * FROM payments WHERE is_paid = FALSE ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total FROM payments WHERE is_paid = FALSE`
      ),
    ]);
    return { data: dataR.rows, total: countR.rows[0].total };
  }

  static async markAsPaid(id: number): Promise<Payments | null> {
    const query = `
      UPDATE payments 
      SET is_paid = TRUE, paid_at = NOW(), updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error marking payment as paid: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async markAsUnpaid(id: number): Promise<Payments | null> {
    const query = `
      UPDATE payments 
      SET is_paid = FALSE, paid_at = NULL, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error marking payment as unpaid: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async markAsPaidByOrderId(orderId: number): Promise<Payments | null> {
    const query = `
      UPDATE payments 
      SET is_paid = TRUE, paid_at = NOW(), updated_at = NOW() 
      WHERE order_id = $1 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error marking payment as paid: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deletePayment(id: number): Promise<boolean> {
    const query = `DELETE FROM payments WHERE id = $1`;

    try {
      const result = await this.db.query(query, [id]);
      return (result.rowCount as number) > 0;
    } catch (error) {
      throw new Error(
        `Error deleting payment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getPaymentWithOrderDetails(id: number): Promise<{
    payment: Payments;
    order: { id: number; total: string; status: string };
    customer: { name: string; email: string; phone: string };
  } | null> {
    const query = `
      SELECT 
        p.*,
        o.id as order_id,
        o.total as order_total,
        o.status as order_status,
        s.customer_name,
        s.email as customer_email,
        s.phone as customer_phone
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN shipping s ON s.id = o.shipping_id
      WHERE p.id = $1
    `;

    try {
      const result = await this.db.query(query, [id]);
      if (!result.rows[0]) return null;

      const row = result.rows[0];
      return {
        payment: {
          id: row.id,
          order_id: row.order_id,
          amount: row.amount,
          currency: row.currency,
          is_paid: row.is_paid,
          paid_at: row.paid_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        order: {
          id: row.order_id,
          total: row.order_total,
          status: row.order_status,
        },
        customer: {
          name: row.customer_name,
          email: row.customer_email,
          phone: row.customer_phone,
        },
      };
    } catch (error) {
      throw new Error(
        `Error getting payment with details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getPaymentStats(): Promise<{
    total_payments: number;
    paid_count: number;
    unpaid_count: number;
    total_paid_amount: string;
    total_unpaid_amount: string;
  }> {
    const query = `
      SELECT
        COUNT(*)::int as total_payments,
        COUNT(*) FILTER (WHERE is_paid = TRUE)::int as paid_count,
        COUNT(*) FILTER (WHERE is_paid = FALSE)::int as unpaid_count,
        COALESCE(SUM(amount) FILTER (WHERE is_paid = TRUE), 0)::text as total_paid_amount,
        COALESCE(SUM(amount) FILTER (WHERE is_paid = FALSE), 0)::text as total_unpaid_amount
      FROM payments
    `;

    try {
      const result = await this.db.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error getting payment stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
