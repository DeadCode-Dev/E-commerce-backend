import { Request, Response } from "express";
import ShippingModel from "@/models/shipping.model";

const VALID_STATUSES = ["pending", "shipped", "delivered", "returned"];

export default async function updateShippingStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const shippingId = Number(req.params.id);
    const { status, tracking_number } = req.body as {
      status?: string;
      tracking_number?: string;
    };

    if (isNaN(shippingId) || shippingId <= 0) {
      res.status(400).json({ message: "Invalid shipping ID" });
      return;
    }

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
      return;
    }

    let shipping = null;

    if (status && tracking_number) {
      // Update both
      shipping = await ShippingModel.updateShipping(shippingId, {
        status: status as "pending" | "shipped" | "delivered" | "returned",
        tracking_number,
      });
    } else if (status) {
      shipping = await ShippingModel.updateShippingStatus(shippingId, status);
    } else if (tracking_number) {
      shipping = await ShippingModel.updateTrackingNumber(
        shippingId,
        tracking_number
      );
    } else {
      res.status(400).json({
        message: "At least status or tracking_number is required",
      });
      return;
    }

    if (!shipping) {
      res.status(404).json({ message: "Shipping not found" });
      return;
    }

    res.status(200).json(shipping);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
