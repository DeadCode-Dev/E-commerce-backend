import { Router } from "express";
import validate from "@/middlewares/validate";
import { isAuthenticated, Role } from "@/middlewares/auth";

// Controllers
import {
  createProduct,
  createProductVariants,
} from "./controllers/createProduct";
import getProducts from "./controllers/getProducts";
import deleteProduct from "./controllers/deleteProduct";
import { updateProduct, updateProductStock } from "./controllers/updateProduct";
import getProductById from "./controllers/getProductById";
import getProductVariants from "./controllers/getProductVariants";
import getProductSizes from "./controllers/getProductSizes";
import getProductColors from "./controllers/getProductColors";
import searchProducts from "./controllers/searchProducts";

// Import filter options controller
import getFilterOptions from "./controllers/getFilterOptions";

// Validators
import {
  createProduct as createProductValidator,
  createProductVariants as createProductVariantsValidator,
} from "./validators/createProduct";
import { getProducts as getProductsValidator } from "./validators/getProducts";
import { deleteProduct as deleteProductValidator } from "./validators/deleteProduct";
import { getProductById as getProductByIdValidator } from "./validators/getProductById";
import { getProductVariants as getProductVariantsValidator } from "./validators/getProductVariants";
import { getProductOptions as getProductOptionsValidator } from "./validators/getProductOptions";
import { searchProducts as searchProductsValidator } from "./validators/searchProducts";
import { updateProduct as updateProductValidator } from "./validators/updateProduct";
import { updateProductStock as updateProductStockValidator } from "./validators/updateProductStock";

const router = Router();

// Search should come before parameterized routes
router.get("/search", validate(searchProductsValidator), searchProducts);

// Get filter options for search dropdowns
router.get("/filters", getFilterOptions);

// Product CRUD operations
router.get("/", validate(getProductsValidator), getProducts);
router.get("/:id", validate(getProductByIdValidator), getProductById);
router.get(
  "/:id/variants",
  validate(getProductVariantsValidator),
  getProductVariants
);
router.get("/:id/sizes", validate(getProductOptionsValidator), getProductSizes);
router.get(
  "/:id/colors",
  validate(getProductOptionsValidator),
  getProductColors
);

// Admin operations (require authentication + admin role)
router.post(
  "/",
  isAuthenticated,
  Role("admin"),
  validate(createProductValidator),
  createProduct
);
router.post(
  "/variants",
  isAuthenticated,
  Role("admin"),
  validate(createProductVariantsValidator),
  createProductVariants
);

// Get product data for editing (merge workflow)
router.get(
  "/:id/edit",
  isAuthenticated,
  Role("admin"),
  validate(getProductByIdValidator),
  updateProduct
);

// Update product with merge support
router.put(
  "/:id",
  isAuthenticated,
  Role("admin"),
  validate(updateProductValidator),
  updateProduct
);
router.put(
  "/:id/stock",
  isAuthenticated,
  Role("admin"),
  validate(updateProductStockValidator),
  updateProductStock
);

router.delete(
  "/:id",
  isAuthenticated,
  Role("admin"),
  validate(deleteProductValidator),
  deleteProduct
);

export default router;
