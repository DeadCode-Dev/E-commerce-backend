// src/modules/product/controllers/productController.ts
import { Request, Response } from "express";
import { ProductService } from "../services/productService";
import { CreateProductRequest } from "../../../types/product/products.entity";

export class ProductController {
  /**
   * Get all products with filters and pagination
   */
  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        category_id,
        brand,
        search,
        min_price,
        max_price,
        colors,
        sizes,
        in_stock_only,
        is_featured,
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        category_id: category_id ? parseInt(category_id as string) : undefined,
        brand: brand as string,
        search: search as string,
        min_price: min_price ? parseFloat(min_price as string) : undefined,
        max_price: max_price ? parseFloat(max_price as string) : undefined,
        colors: colors ? (colors as string).split(",") : undefined,
        sizes: sizes ? (sizes as string).split(",") : undefined,
        in_stock_only: in_stock_only === "true",
        is_featured:
          is_featured === "true"
            ? true
            : is_featured === "false"
              ? false
              : undefined,
      };

      const result = await ProductService.getProducts(options);

      res.status(200).json({
        message: "Products retrieved successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error in getProducts:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Get single product by ID with variants
   */
  static async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          message: "Invalid product ID",
          code: "INVALID_PRODUCT_ID",
        });
        return;
      }

      const product = await ProductService.getProductWithVariants(productId);

      if (!product) {
        res.status(404).json({
          message: "Product not found",
          code: "PRODUCT_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        message: "Product retrieved successfully",
        product,
      });
    } catch (error) {
      console.error("Error in getProduct:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Get product by slug
   */
  static async getProductBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      if (!slug) {
        res.status(400).json({
          message: "Product slug is required",
          code: "MISSING_SLUG",
        });
        return;
      }

      const product = await ProductService.getProductBySlug(slug);

      if (!product) {
        res.status(404).json({
          message: "Product not found",
          code: "PRODUCT_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        message: "Product retrieved successfully",
        product,
      });
    } catch (error) {
      console.error("Error in getProductBySlug:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const products = await ProductService.getFeaturedProducts(limit);

      res.status(200).json({
        message: "Featured products retrieved successfully",
        products,
        count: products.length,
      });
    } catch (error) {
      console.error("Error in getFeaturedProducts:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Check variant availability
   */
  static async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);
      const { color, size, material } = req.query as {
        color?: string;
        size?: string;
        material?: string;
      };

      if (isNaN(productId)) {
        res.status(400).json({
          message: "Invalid product ID",
          code: "INVALID_PRODUCT_ID",
        });
        return;
      }

      const result = await ProductService.checkVariantStock(
        productId,
        color,
        size,
        material
      );

      res.status(200).json({
        message: "Availability checked successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Get product options (colors, sizes, materials)
   */
  static async getProductOptions(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);

      if (isNaN(productId)) {
        res.status(400).json({
          message: "Invalid product ID",
          code: "INVALID_PRODUCT_ID",
        });
        return;
      }

      const options = await ProductService.getProductOptions(productId);

      res.status(200).json({
        message: "Product options retrieved successfully",
        options,
      });
    } catch (error) {
      console.error("Error getting product options:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Search products
   */
  static async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        q: query,
        page = 1,
        limit = 20,
        category_id,
        min_price,
        max_price,
      } = req.query;

      if (!query) {
        res.status(400).json({
          message: "Search query is required",
          code: "MISSING_QUERY",
        });
        return;
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        category_id: category_id ? parseInt(category_id as string) : undefined,
        min_price: min_price ? parseFloat(min_price as string) : undefined,
        max_price: max_price ? parseFloat(max_price as string) : undefined,
      };

      const result = await ProductService.searchProducts(
        query as string,
        options
      );

      res.status(200).json({
        message: "Search completed successfully",
        query,
        ...result,
      });
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Create new product (Admin only)
   */
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData: CreateProductRequest = req.body;

      const product = await ProductService.createProduct(productData);

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error("Error creating product:", error);

      if (
        error instanceof Error &&
        error.message.includes("Missing required fields")
      ) {
        res.status(400).json({
          message: error.message,
          code: "VALIDATION_ERROR",
        });
        return;
      }

      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Update product (Admin only)
   */
  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id);
      const productData = req.body;

      if (isNaN(productId)) {
        res.status(400).json({
          message: "Invalid product ID",
          code: "INVALID_PRODUCT_ID",
        });
        return;
      }

      const product = await ProductService.updateProduct(
        productId,
        productData
      );

      if (!product) {
        res.status(404).json({
          message: "Product not found",
          code: "PRODUCT_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Get low stock alerts (Admin only)
   */
  static async getLowStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      const productId = req.query.product_id
        ? parseInt(req.query.product_id as string)
        : undefined;

      const alerts = await ProductService.getLowStockAlerts(productId);

      res.status(200).json({
        message: "Low stock alerts retrieved successfully",
        alerts,
        count: alerts.length,
      });
    } catch (error) {
      console.error("Error getting low stock alerts:", error);
      res.status(500).json({
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
