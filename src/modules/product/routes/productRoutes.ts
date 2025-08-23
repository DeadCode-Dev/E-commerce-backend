// src/modules/product/routes/productRoutes.ts
import { Router } from "express";
import { ProductController } from "../controllers/productController";
import { isAuthenticated } from "../../../middlewares/auth";

const productRouter = Router();

/**
 * Public Product Routes
 */

// Get all products with filters
productRouter.get("/", ProductController.getProducts);

// Search products
productRouter.get("/search", ProductController.searchProducts);

// Get featured products
productRouter.get("/featured", ProductController.getFeaturedProducts);

// Get product by slug
productRouter.get("/slug/:slug", ProductController.getProductBySlug);

// Get product by ID
productRouter.get("/:id", ProductController.getProduct);

// Check variant availability
productRouter.get("/:id/availability", ProductController.checkAvailability);

// Get product options (colors, sizes, materials)
productRouter.get("/:id/options", ProductController.getProductOptions);

/**
 * Admin Only Routes (protected by authentication)
 */

// Create new product
productRouter.post("/", isAuthenticated, ProductController.createProduct);

// Update product
productRouter.put("/:id", isAuthenticated, ProductController.updateProduct);

// Get low stock alerts
productRouter.get(
  "/admin/low-stock",
  isAuthenticated,
  ProductController.getLowStockAlerts
);

export default productRouter;
