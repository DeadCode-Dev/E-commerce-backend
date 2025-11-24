import { Request, Response } from "express";
import ShippingModel from "@/models/shipping.model";
import pg from "@/config/postgres";

export default async function trackOrder(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { tracking_number } = req.params;

    if (!tracking_number) {
      res.status(400).json({ message: "Tracking number is required" });
      return;
    }

    const shipping =
      await ShippingModel.findShippingByTrackingNumber(tracking_number);

    if (!shipping) {
      res.status(404).json({ message: "Tracking number not found" });
      return;
    }

    // Get the associated order
    const orderResult = await pg.query(
      `SELECT id, total, status, created_at FROM orders WHERE shipping_id = $1`,
      [shipping.id]
    );

    const order = orderResult.rows[0];

    res.status(200).json({
      tracking_number: shipping.tracking_number,
      shipping_status: shipping.status,
      order_status: order?.status || null,
      order_total: order?.total || null,
      order_date: order?.created_at || null,
      shipping_address: {
        customer_name: shipping.customer_name,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        postal_code: shipping.postal_code,
        country: shipping.country,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
