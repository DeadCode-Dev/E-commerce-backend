import ProductModel from "@/models/product.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import { Request, Response } from "express";

export default function getProductById(req: Request, res: Response): void {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    responder(res, responses.Error.invalidInput, {
      message: "Invalid product ID",
    });
    return;
  }

  ProductModel.getProductWithVariants(productId)
    .then((product) => {
      if (!product) {
        responder(res, responses.api.products.notFound);
        return;
      }
      res.json({
        success: true,
        data: product,
      });
    })
    .catch((error: Error) => {
      console.error("Error fetching product:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to fetch product",
      });
    });
}
