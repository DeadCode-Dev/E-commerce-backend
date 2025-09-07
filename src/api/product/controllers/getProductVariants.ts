import ProductModel from "@/models/product.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import { Request, Response } from "express";

export default function getProductVariants(req: Request, res: Response): void {
  const productId = parseInt(req.params.id);
  const size = req.query.size as string;
  const color = req.query.color as string;

  if (isNaN(productId)) {
    responder(res, responses.Error.invalidInput, {
      message: "Invalid product ID",
    });
    return;
  }

  if (size || color) {
    // Get specific variant availability
    ProductModel.checkVariantAvailability(productId, size, color)
      .then((variant) => {
        if (!variant) {
          responder(res, responses.api.products.notFound, {
            message: "Product variant not found",
          });
          return;
        }
        res.json({
          success: true,
          data: variant,
        });
      })
      .catch((error: Error) => {
        console.error("Error fetching product variant:", error);
        responder(res, responses.Error.internalServerError, {
          message: "Failed to fetch product variant",
        });
      });
  } else {
    // Get all variants for the product
    ProductModel.getProductWithVariants(productId)
      .then((product) => {
        if (!product) {
          responder(res, responses.api.products.notFound);
          return;
        }
        res.json({
          success: true,
          data: {
            variants: product.available_variants,
            variant_options: product.variant_options,
          },
        });
      })
      .catch((error: Error) => {
        console.error("Error fetching product variants:", error);
        responder(res, responses.Error.internalServerError, {
          message: "Failed to fetch product variants",
        });
      });
  }
}
