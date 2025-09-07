import ProductModel from "@/models/product.model";
import CategoryModel from "@/models/category.model";
import responder from "@/services/responder.service";
import responses from "@/services/responses";
import { Request, Response } from "express";

export default function getFilterOptions(req: Request, res: Response): void {
  Promise.all([
    // Get all distinct categories
    CategoryModel.getAllDistinctCategories(),

    // Get all distinct sizes across all products
    ProductModel.getAllDistinctSizes(),

    // Get all distinct colors across all products
    ProductModel.getAllDistinctColors(),

    // Get price range
    ProductModel.getPriceRange(),

    // Get brands if available (placeholder for future)
    Promise.resolve([]),
  ])
    .then(([categories, sizes, colors, priceRange, brands]) => {
      res.json({
        success: true,
        data: {
          categories: categories || [],
          sizes: sizes || [],
          colors: colors || [],
          priceRange: priceRange || { min: 0, max: 1000 },
          brands: brands || [],
          // Additional filter metadata
          sortOptions: [
            { value: "name", label: "Name" },
            { value: "price", label: "Price" },
            { value: "created_at", label: "Newest" },
            { value: "popularity", label: "Popular" },
          ],
          sortOrders: [
            { value: "ASC", label: "Ascending" },
            { value: "DESC", label: "Descending" },
          ],
        },
      });
    })
    .catch((error: Error) => {
      console.error("Error fetching filter options:", error);
      responder(res, responses.Error.internalServerError, {
        message: "Failed to fetch filter options",
      });
    });
}
