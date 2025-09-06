import ProductModel from "@/models/product.model";
import ProductVariantModel from "@/models/productVariant.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import ProductVariant from "@/types/product/variant.entity";
import { Request, Response } from "express";

export function createProduct(req: Request, res: Response) {
  ProductModel.createProduct({
    name: req.body.name,
    description: req.body.description,
  })
    .then((product) => {
      responder(res, responses.api.products.created, {
        product_id: product.id,
      });
    })
    .catch((error) => {
      console.error("Error creating product:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to create product",
      });
    });
}

export function createProductVariants(req: Request, res: Response) {
  const productId = parseInt(req.body.product_id);
  const variants = req.body.variants as ProductVariant[]; // Expecting an array of variants

  if (!Array.isArray(variants) || variants.length === 0) {
    return responder(res, responses.Error.invalidInput, {
      message: "Variants must be a non-empty array",
    });
  }

  ProductVariantModel.createMultipleVariants(productId, variants)
    .then((createdVariants) => {
      responder(res, responses.api.products.created, {
        variants: createdVariants,
      });
    })
    .catch((error) => {
      console.error("Error creating product variants:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to create product variants",
      });
    });
}
