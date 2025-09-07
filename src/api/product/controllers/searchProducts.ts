import ProductModel, { ProductSearchOptions } from "@/models/product.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import { Request, Response } from "express";

export default function searchProducts(req: Request, res: Response): void {
  const searchOptions: ProductSearchOptions = {
    name: req.query.name as string,
    category: req.query.category as string,
    minPrice: req.query.minPrice
      ? parseFloat(req.query.minPrice as string)
      : undefined,
    maxPrice: req.query.maxPrice
      ? parseFloat(req.query.maxPrice as string)
      : undefined,
    size: req.query.size as string,
    color: req.query.color as string,
    inStock: req.query.inStock === "true",
    sortBy: req.query.sortBy as "name" | "price" | "created_at" | "popularity",
    sortOrder: req.query.sortOrder as "ASC" | "DESC",
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  // Remove undefined values
  Object.keys(searchOptions).forEach((key) => {
    if (
      searchOptions[key as keyof ProductSearchOptions] === undefined ||
      searchOptions[key as keyof ProductSearchOptions] === ""
    ) {
      delete searchOptions[key as keyof ProductSearchOptions];
    }
  });

  ProductModel.searchProducts(searchOptions)
    .then((result) => {
      res.json({
        success: true,
        data: {
          products: result.products,
          total: result.total,
          page:
            Math.floor(
              (searchOptions.offset || 0) / (searchOptions.limit || 20),
            ) + 1,
          totalPages: Math.ceil(result.total / (searchOptions.limit || 20)),
        },
      });
    })
    .catch((error: Error) => {
      console.error("Error searching products:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to search products",
      });
    });
}
