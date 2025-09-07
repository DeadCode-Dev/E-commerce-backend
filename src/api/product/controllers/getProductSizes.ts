import ProductModel from "@/models/product.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import { Request, Response } from "express";

export default function getProductSizes(req: Request, res: Response): void {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    responder(res, responses.Error.invalidInput, {
      message: "Invalid product ID",
    });
    return;
  }

  ProductModel.getProductSizes(productId)
    .then((sizes) => {
      res.json({
        success: true,
        data: { sizes },
      });
    })
    .catch((error: Error) => {
      console.error("Error fetching product sizes:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to fetch product sizes",
      });
    });
}
