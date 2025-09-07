import ProductModel from "@/models/product.model";
import ProductVariantModel from "@/models/productVariant.model";
import CategoryModel from "@/models/category.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import ProductVariant from "@/types/product/variant.entity";
import { Request, Response } from "express";

/**
 * Update product with merge strategy - sends current data to frontend,
 * receives updated data and merges with existing data
 */
export function updateProduct(req: Request, res: Response): void {
  const productId = parseInt(req.params.id);
  const updateData = req.body;

  // If this is a GET request to fetch current data for editing
  if (req.method === "GET") {
    ProductModel.getProductWithVariants(productId)
      .then((product) => {
        if (!product) {
          responder(res, responses.api.products.notFound);
          return;
        }

        // Send complete product data for frontend editing
        res.json({
          success: true,
          data: {
            product: {
              id: product.id,
              name: product.name,
              description: product.description,
            },
            variants: product.available_variants,
            images: product.images,
            categories: product.categories,
            last_updated: new Date().toISOString(), // For conflict detection
          },
        });
      })
      .catch((error: Error) => {
        console.error("Error fetching product for edit:", error);
        responder(res, responses.Error.internalServerError, {
          message: "Failed to fetch product data",
        });
      });
    return;
  }

  // Handle PUT/PATCH request to update the product
  const { product, variants, categories, last_updated } = updateData;

  // Basic conflict detection (optional - you can implement more sophisticated versioning)
  if (last_updated) {
    // Here you could check if the product was modified since last_updated
    // For now, we'll proceed with the merge
  }

  // Start transaction-like updates
  const updatePromises: Promise<unknown>[] = [];

  // Update basic product info if provided
  if (product && (product.name || product.description)) {
    updatePromises.push(
      ProductModel.updateProduct(productId, {
        name: product.name,
        description: product.description,
      })
    );
  }

  // Update variants if provided
  if (variants && Array.isArray(variants)) {
    variants.forEach((variant: Partial<ProductVariant & { id?: number }>) => {
      if (variant.id) {
        // Update existing variant
        updatePromises.push(
          ProductVariantModel.updateVariant(variant.id, {
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            price: variant.price,
          })
        );
      } else {
        // Create new variant
        updatePromises.push(
          ProductVariantModel.createVariant({
            product_id: productId,
            size: variant.size || "",
            color: variant.color || "",
            stock: variant.stock || 0,
            price: variant.price || 0,
          })
        );
      }
    });
  }

  // Update categories if provided
  if (categories && Array.isArray(categories)) {
    // First, get existing categories
    updatePromises.push(
      CategoryModel.findCategoriesByProductId(productId).then(
        (existingCategories) => {
          const existingCategoryNames = existingCategories.map(
            (cat) => cat.name
          );
          const newCategoryNames = categories.filter(
            (name: string) => !existingCategoryNames.includes(name)
          );

          // Add new categories
          return Promise.all(
            newCategoryNames.map((name: string) =>
              CategoryModel.createCategory({ name, product_id: productId })
            )
          );
        }
      )
    );
  }

  Promise.all(updatePromises)
    .then(() => {
      // Fetch and return updated product data
      return ProductModel.getProductWithVariants(productId);
    })
    .then((updatedProduct) => {
      if (!updatedProduct) {
        responder(res, responses.api.products.notFound);
        return;
      }

      responder(res, responses.api.products.updated, {
        product: updatedProduct,
        message: "Product updated successfully with merged data",
      });
    })
    .catch((error: Error) => {
      console.error("Error updating product:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to update product",
        details: error.message,
      });
    });
}

/**
 * Update specific variant stock
 */
export function updateProductStock(req: Request, res: Response): void {
  const { variant_id, stock } = req.body;

  ProductVariantModel.updateVariant(variant_id, { stock })
    .then((variant: ProductVariant | null) => {
      if (!variant) {
        responder(res, responses.api.products.notFound, {
          message: "Product variant not found",
        });
        return;
      }
      responder(res, responses.api.products.updated, { variant });
    })
    .catch((error: Error) => {
      console.error("Error updating product stock:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to update product stock",
      });
    });
}

/**
 * Bulk update product details (alternative to updateProduct for simple updates)
 */
export function updateProductDetails(req: Request, res: Response): void {
  const productId = parseInt(req.params.id);
  const updateData = req.body;

  ProductModel.updateProduct(productId, updateData)
    .then((product) => {
      if (!product) {
        responder(res, responses.api.products.notFound);
        return;
      }
      responder(res, responses.api.products.updated, { product });
    })
    .catch((error: Error) => {
      console.error("Error updating product details:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to update product details",
      });
    });
}

/**
 * Update product images (placeholder for future implementation)
 */
export function updateProductImages(req: Request, res: Response): void {
  responder(res, {
    code: 501,
    message: "Image management not implemented yet. Use /images API endpoints.",
  });
}

/**
 * Update product categories (placeholder - use updateProduct for full merge)
 */
export function updateProductCategories(req: Request, res: Response): void {
  responder(res, {
    code: 501,
    message:
      "Use PUT /products/:id for category management with full merge support.",
  });
}
