import { Request, Response } from "express";
import pg from "@/config/postgres";
import OrdersModel from "@/models/orders.model";
import ShippingModel from "@/models/shipping.model";
import OrderItemsModel from "@/models/orderItems.model";
import Mailer from "@/services/mailler.service";

interface IncomingItem {
  variant_id: number;
  quantity: number;
}

export default async function createOrder(
  req: Request,
  res: Response
): Promise<void> {
  const { address, city, postal_code, country, state, items } = req.body as {
    address: string;
    city: string;
    postal_code: string;
    country: string;
    state?: string;
    items: IncomingItem[];
  };

  if (!req.user?.id) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "Items array required" });
    return;
  }

  const client = await pg.connect();
  try {
    await client.query("BEGIN");

    // Lock variants and fetch prices in single query
    const variantIds = items.map((i) => i.variant_id);
    const variantsRes = await client.query(
      `SELECT pv.id, pv.price, pv.stock, pv.product_id, pv.sku, p.name
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ANY($1::int[])
       FOR UPDATE`,
      [variantIds]
    );

    const variantMap = new Map<number, (typeof variantsRes.rows)[0]>();
    variantsRes.rows.forEach((r) => variantMap.set(r.id, r));

    // Validate all items exist and have sufficient stock
    for (const item of items) {
      const v = variantMap.get(item.variant_id);
      if (!v) {
        throw new Error(`Variant ${item.variant_id} not found`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for variant ${item.variant_id}`);
      }
      if (v.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${v.name}" (available: ${v.stock})`
        );
      }
    }

    // Compute total server-side (never trust client)
    const total = items.reduce((sum, item) => {
      const v = variantMap.get(item.variant_id)!;
      return sum + parseFloat(v.price) * item.quantity;
    }, 0);

    // Decrement stock atomically
    await client.query(
      `UPDATE product_variants AS pv
       SET stock = pv.stock - upd.qty
       FROM (
         SELECT UNNEST($1::int[]) AS vid, UNNEST($2::int[]) AS qty
       ) AS upd
       WHERE pv.id = upd.vid`,
      [items.map((i) => i.variant_id), items.map((i) => i.quantity)]
    );

    // Create shipping
    const shipping = await ShippingModel.createShippingWithClient(client, {
      user_id: req.user.id,
      tracking_number: `TRACK${Date.now()}`,
      address,
      city,
      state: state || undefined,
      postal_code,
      country,
      shipping_status: "pending",
    });

    // Create order with computed total
    const order = await OrdersModel.createOrderWithClient(client, {
      user_id: req.user.id,
      shipping_id: shipping.id,
      total,
      status: "pending",
    });

    // Insert order items with price snapshot
    await OrderItemsModel.createMultipleOrderItemsWithClient(
      client,
      order.id,
      items.map((item) => ({
        order_id: order.id,
        product_variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: parseFloat(variantMap.get(item.variant_id)!.price),
      }))
    );

    await client.query("COMMIT");

    // Send confirmation email asynchronously (don't block response)
    const emailPayload = await OrdersModel.getOrderEmailPayload(order.id);
    if (emailPayload?.email) {
      Mailer.OrderConfirmation(emailPayload.email, {
        firstName: req.user.username || "Customer",
        orderNumber: `${order.id}`,
        orderDate: `${order.created_at}`,
        products: emailPayload.items.map((i) => ({
          product_name: i.product_name,
          variant_price: i.unit_price,
          quantity: i.quantity,
        })),
        trackingUrl: `${process.env.CORS_ORIGIN}/tracking/${shipping.tracking_number}`,
        shippingCost: 70,
      }).catch((err) => console.error("Email send error:", err));
    }

    res.status(201).json({
      order_id: order.id,
      total,
      status: order.status,
      tracking_number: shipping.tracking_number,
      items_count: items.length,
    });
  } catch (e) {
    await client.query("ROLLBACK");
    const message = e instanceof Error ? e.message : "Order creation failed";
    res.status(400).json({ message });
  } finally {
    client.release();
  }
}
