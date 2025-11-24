import ProductModel from "@/models/product.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import { Request, Response } from "express";

export default function getProductColors(req: Request, res: Response): void {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    responder(res, responses.Error.invalidInput, {
      message: "Invalid product ID",
    });
    return;
  }

  ProductModel.getProductColors(productId)
    .then((colors) => {
      res.json({
        success: true,
        data: { colors },
      });
    })
    .catch((error: Error) => {
      console.error("Error fetching product colors:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to fetch product colors",
      });
    });
}
