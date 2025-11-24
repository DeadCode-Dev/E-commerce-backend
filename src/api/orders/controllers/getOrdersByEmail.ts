import { Request, Response } from "express";
import pg from "@/config/postgres";

export default async function getOrdersByEmail(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email } = req.query as { email?: string };

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const result = await pg.query(
      `SELECT 
        o.id,
        o.total,
        o.status,
        o.created_at,
        s.tracking_number,
        s.status as shipping_status,
        s.customer_name,
        s.email,
        s.phone
      FROM orders o
      JOIN shipping s ON s.id = o.shipping_id
      WHERE s.email = $1
      ORDER BY o.created_at DESC`,
      [email.toLowerCase()]
    );

    res.status(200).json({
      email,
      orders: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
