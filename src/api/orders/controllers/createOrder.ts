import { Request, Response } from "express";
import OrdersModel from "@/models/orders.model";
import ShippingModel from "@/models/shipping.model";
import OrderItemsModel from "@/models/orderItems.model";
import Mailer from "@/services/mailler.service";
import ProductModel from "@/models/product.model";

export default async function createOrder(
  req: Request,
  res: Response
): Promise<void> {
  const { address, city, postal_code, country, items } = req.body;
  const result = [];

  for (const item of items) {
    const product = await ProductModel.getProductByVariantId(item.variant_id);
    if (!product) {
      res
        .status(404)
        .json({
          message: `Product with variant ID ${item.variant_id} not found.`,
        });
      return;
    }
    result.push({ ...product, quantity: item.quantity });
  }
  const total = result.reduce(
    (acc, item) => acc + item.variant_price * item.quantity,
    0
  );
  const shipping = await ShippingModel.createShipping({
    user_id: req.user?.id,
    tracking_number: `TRACK${Date.now()}`,
    address,
    city,
    state: req.body.state,
    postal_code,
    country,
    shipping_status: "pending",
  });
  const order = await OrdersModel.createOrder({
    user_id: req.user?.id,
    shipping_id: shipping.id,
    total,
    status: "pending",
  });
  await OrderItemsModel.createMultipleOrderItems(order.id, items);

  Mailer.OrderConfirmation(req.user?.email as string, {
    firstName: req.user?.username as string,
    orderNumber: `${order.id}`,
    orderDate: `${order.created_at}`,
    products: result,
    trackingUrl: `${process.env.CORS_ORIGIN}/tracking/${shipping.tracking_number}`,
    shippingCost: 70,
  });
}
