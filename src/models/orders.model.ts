import pg from "../config/postgres";
import Orders from "../types/order/orders.entity";

interface OrderEmailPayload {
  id: number;
  total: number;
  status: string;
  created_at: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  shipping: {
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    tracking_number: string | null;
    status: string | null;
  } | null;
  items: Array<{
    item_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

export default class OrdersModel {
  static db = pg;

  // Predefined query texts (avoid re-parsing)
  private static q = {
    insert: `
      INSERT INTO orders (user_id, shipping_id, total, status)
      VALUES ($1, $2, $3, COALESCE($4,'pending'))
      RETURNING id, user_id, shipping_id, total, status, created_at, updated_at
    `,
    byId: `
      SELECT id, user_id, shipping_id, total, status, created_at, updated_at
      FROM orders WHERE id = $1
    `,
    byUser: `
      SELECT id, user_id, shipping_id, total, status, created_at, updated_at
      FROM orders WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    allPaged: `
      SELECT id, user_id, shipping_id, total, status, created_at, updated_at
      FROM orders ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `,
    updateStatus: `
      UPDATE orders SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, user_id, shipping_id, total, status, created_at, updated_at
    `,
    delete: `DELETE FROM orders WHERE id = $1`,
    emailPayload: `
      SELECT
        o.id,
        o.total,
        o.status,
        o.created_at::text,
        u.username,
        u.email,
        u.phone,
        CASE WHEN s.id IS NOT NULL THEN json_build_object(
          'address', s.address,
          'city', s.city,
          'state', s.state,
          'postal_code', s.postal_code,
          'country', s.country,
          'tracking_number', s.tracking_number,
          'status', s.status
        ) ELSE NULL END AS shipping,
        COALESCE(
          json_agg(
            json_build_object(
              'item_id', oi.id,
              'product_id', pv.product_id,
              'variant_id', pv.id,
              'product_name', p.name,
              'sku', pv.sku,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'line_total', oi.quantity * oi.unit_price
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN shipping s ON s.id = o.shipping_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id
      LEFT JOIN products p ON p.id = pv.product_id
      WHERE o.id = $1
      GROUP BY o.id, u.id, s.id
    `,
  };

  static async createOrder(data: Partial<Orders>): Promise<Orders> {
    const values = [
      data.user_id,
      data.shipping_id || null,
      data.total,
      data.status || null,
    ];
    const r = await this.db.query(this.q.insert, values);
    return r.rows[0];
  }

  static async findOrderById(id: number): Promise<Orders | null> {
    const r = await this.db.query(this.q.byId, [id]);
    return r.rows[0] || null;
  }

  static async findOrdersByUserId(
    userId: number,
    limit = 50,
    offset = 0
  ): Promise<Orders[]> {
    const r = await this.db.query(this.q.byUser, [userId, limit, offset]);
    return r.rows;
  }

  static async getAllOrders(
    limit = 50,
    offset = 0
  ): Promise<{ data: Orders[]; total: number }> {
    const [dataR, countR] = await Promise.all([
      this.db.query(this.q.allPaged, [limit, offset]),
      this.db.query(`SELECT COUNT(*)::int AS total FROM orders`),
    ]);
    return { data: dataR.rows, total: countR.rows[0].total };
  }

  static async updateOrder(
    id: number,
    data: Partial<Orders>
  ): Promise<Orders | null> {
    const allowed: (keyof Orders)[] = [
      "user_id",
      "shipping_id",
      "total",
      "status",
    ];
    const entries = allowed
      .filter((k) => data[k] !== undefined && data[k] !== null)
      .map((k) => [k, data[k]] as [string, unknown]);

    if (entries.length === 0) return null;

    const setClause = entries.map(([k], i) => `${k} = $${i + 1}`).join(", ");

    const sql = `
      UPDATE orders
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${entries.length + 1}
      RETURNING id, user_id, shipping_id, total, status, created_at, updated_at
    `;
    const values = [...entries.map(([, v]) => v), id];
    const r = await this.db.query(sql, values);
    return r.rows[0] || null;
  }

  static async updateOrderStatus(
    id: number,
    status: string
  ): Promise<Orders | null> {
    const r = await this.db.query(this.q.updateStatus, [status, id]);
    return r.rows[0] || null;
  }

  static async bulkUpdateStatus(
    ids: number[],
    status: string
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const sql = `
      UPDATE orders SET status = $1, updated_at = NOW()
      WHERE id = ANY($2::int[])
    `;
    const r = await this.db.query(sql, [status, ids]);
    return r.rowCount as number;
  }

  static async deleteOrder(id: number): Promise<boolean> {
    const r = await this.db.query(this.q.delete, [id]);
    return r.rowCount as number > 0;
  }

  static async getOrderEmailPayload(
    id: number
  ): Promise<OrderEmailPayload | null> {
    const r = await this.db.query(this.q.emailPayload, [id]);
    return r.rows[0] || null;
  }

  static async getOrderWithDetails(
    id: number
  ): Promise<OrderEmailPayload | null> {
    // Reuse email payload (already optimized)
    return this.getOrderEmailPayload(id);
  }
}
