// src/modules/product/services/productService.ts
import { ProductModel } from "../models/productModel";
import { VariantModel } from "../models/variantModel";
import Product, {
  ProductWithVariants,
  CreateProductRequest,
  StockOperation,
  ProductListResponse,
  ProductVariant,
} from "../../../types/product/products.entity";

export class ProductService {
  /**
   * Get product with all variants and stock information
   */
  static async getProductWithVariants(
    id: number
  ): Promise<ProductWithVariants | null> {
    return await ProductModel.findWithVariants(id);
  }

  /**
   * Get product by slug with variants
   */
  static async getProductBySlug(
    slug: string
  ): Promise<ProductWithVariants | null> {
    const product = await ProductModel.findBySlug(slug);
    if (!product) return null;

    return await ProductModel.findWithVariants(product.id);
  }

  /**
   * Get products with filters and pagination
   */
  static async getProducts(options: {
    page?: number;
    limit?: number;
    category_id?: number;
    brand?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    colors?: string[];
    sizes?: string[];
    in_stock_only?: boolean;
    is_featured?: boolean;
  }): Promise<ProductListResponse> {
    try {
      const { products, total } = await ProductModel.findMany(options);
      const page = options.page || 1;
      const limit = options.limit || 20;
      const totalPages = Math.ceil(total / limit);

      // Get filter options for the response
      const filters = await this.getFilterOptions();

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
        filters,
      };
    } catch (error) {
      console.error("Error in getProducts service:", error);
      throw new Error("Failed to fetch products");
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit = 10): Promise<ProductWithVariants[]> {
    try {
      const { products } = await ProductModel.findMany({
        is_featured: true,
        limit,
        in_stock_only: true,
      });
      return products;
    } catch (error) {
      console.error("Error fetching featured products:", error);
      throw new Error("Failed to fetch featured products");
    }
  }

  /**
   * Check variant stock and availability
   */
  static async checkVariantStock(
    productId: number,
    color?: string,
    size?: string,
    material?: string
  ): Promise<{
    available: boolean;
    stock: number;
    variant?: {
      id: number;
      sku: string;
      price: number;
    };
  }> {
    try {
      const stock = await VariantModel.checkStock(
        productId,
        color,
        size,
        material
      );
      const variant = await VariantModel.findByAttributes(
        productId,
        color,
        size,
        material
      );

      return {
        available: stock > 0,
        stock,
        variant: variant
          ? {
              id: variant.id,
              sku: variant.sku,
              price: variant.price || 0,
            }
          : undefined,
      };
    } catch (error) {
      console.error("Error checking variant stock:", error);
      throw new Error("Failed to check variant stock");
    }
  }

  /**
   * Get available options for product selection
   */
  static async getProductOptions(productId: number): Promise<{
    colors: Array<{ color: string; available_sizes: string[]; stock: number }>;
    sizes: Array<{ size: string; available_colors: string[]; stock: number }>;
    materials: string[];
  }> {
    try {
      const variants = await VariantModel.findByProductId(productId);

      // Group by colors with available sizes
      const colorMap = new Map<string, { sizes: Set<string>; stock: number }>();
      const sizeMap = new Map<string, { colors: Set<string>; stock: number }>();
      const materials = new Set<string>();

      variants.forEach((variant) => {
        const availableStock = variant.stock - variant.reserved_stock;

        if (availableStock > 0) {
          // Colors
          if (variant.color) {
            if (!colorMap.has(variant.color)) {
              colorMap.set(variant.color, { sizes: new Set(), stock: 0 });
            }
            const colorData = colorMap.get(variant.color)!;
            if (variant.size) colorData.sizes.add(variant.size);
            colorData.stock += availableStock;
          }

          // Sizes
          if (variant.size) {
            if (!sizeMap.has(variant.size)) {
              sizeMap.set(variant.size, { colors: new Set(), stock: 0 });
            }
            const sizeData = sizeMap.get(variant.size)!;
            if (variant.color) sizeData.colors.add(variant.color);
            sizeData.stock += availableStock;
          }

          // Materials
          if (variant.material) {
            materials.add(variant.material);
          }
        }
      });

      return {
        colors: Array.from(colorMap.entries()).map(([color, data]) => ({
          color,
          available_sizes: Array.from(data.sizes),
          stock: data.stock,
        })),
        sizes: Array.from(sizeMap.entries()).map(([size, data]) => ({
          size,
          available_colors: Array.from(data.colors),
          stock: data.stock,
        })),
        materials: Array.from(materials),
      };
    } catch (error) {
      console.error("Error getting product options:", error);
      throw new Error("Failed to get product options");
    }
  }

  /**
   * Create a new product with variants
   */
  static async createProduct(
    productData: CreateProductRequest
  ): Promise<Product> {
    try {
      // Validate required fields
      if (
        !productData.name ||
        !productData.sku_prefix ||
        !productData.base_price
      ) {
        throw new Error(
          "Missing required fields: name, sku_prefix, base_price"
        );
      }

      if (!productData.variants || productData.variants.length === 0) {
        throw new Error("At least one variant is required");
      }

      return await ProductModel.create(productData);
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  /**
   * Update product
   */
  static async updateProduct(
    id: number,
    productData: Partial<CreateProductRequest>
  ): Promise<Product | null> {
    try {
      return await ProductModel.update(id, productData);
    } catch (error) {
      console.error("Error updating product:", error);
      throw new Error("Failed to update product");
    }
  }

  /**
   * Stock management operations
   */
  static async manageStock(operation: StockOperation): Promise<boolean> {
    try {
      return await VariantModel.manageStock(operation);
    } catch (error) {
      console.error("Error managing stock:", error);
      throw error;
    }
  }

  /**
   * Reserve stock for order
   */
  static async reserveStock(
    variantId: number,
    quantity: number
  ): Promise<boolean> {
    return await this.manageStock({
      variant_id: variantId,
      quantity,
      operation: "reserve",
      reason: "Order reservation",
    });
  }

  /**
   * Release reserved stock (cancel order)
   */
  static async releaseStock(
    variantId: number,
    quantity: number
  ): Promise<boolean> {
    return await this.manageStock({
      variant_id: variantId,
      quantity,
      operation: "release",
      reason: "Order cancellation",
    });
  }

  /**
   * Fulfill order (convert reserved to sold)
   */
  static async fulfillStock(
    variantId: number,
    quantity: number
  ): Promise<boolean> {
    return await this.manageStock({
      variant_id: variantId,
      quantity,
      operation: "fulfill",
      reason: "Order fulfillment",
    });
  }

  /**
   * Get low stock alerts
   */
  static async getLowStockAlerts(productId?: number): Promise<
    {
      product_name: string;
      variant_sku: string;
      color?: string;
      size?: string;
      current_stock: number;
      min_stock_alert: number;
    }[]
  > {
    try {
      const variants = await VariantModel.getLowStockVariants(productId);

      return variants.map((variant) => ({
        product_name:
          (variant as ProductVariant & { product_name?: string })
            .product_name || "Unknown",
        variant_sku: variant.sku,
        color: variant.color,
        size: variant.size,
        current_stock: variant.stock,
        min_stock_alert: variant.min_stock_alert,
      }));
    } catch (error) {
      console.error("Error getting low stock alerts:", error);
      throw new Error("Failed to get low stock alerts");
    }
  }

  /**
   * Search products
   */
  static async searchProducts(
    query: string,
    options: {
      page?: number;
      limit?: number;
      category_id?: number;
      min_price?: number;
      max_price?: number;
    } = {}
  ): Promise<ProductListResponse> {
    try {
      return await this.getProducts({
        ...options,
        search: query,
        in_stock_only: true,
      });
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error("Failed to search products");
    }
  }

  /**
   * Get filter options for product listing
   */
  private static async getFilterOptions(): Promise<{
    categories: Array<{ id: number; name: string; slug: string }>;
    brands: string[];
    price_range: { min: number; max: number };
    colors: string[];
    sizes: string[];
    materials: string[];
  }> {
    try {
      // This would typically be cached or optimized with dedicated queries
      const [categoriesResult, brandsResult, priceResult, attributesResult] =
        await Promise.all([
          // Categories
          ProductModel.findMany({ limit: 1000 }).then((result) => [
            ...new Map(
              result.products
                .filter((p) => p.category)
                .map((p) => [p.category!.id, p.category!])
            ).values(),
          ]),

          // Brands
          ProductModel.findMany({ limit: 1000 }).then(
            (result) =>
              [
                ...new Set(result.products.map((p) => p.brand).filter(Boolean)),
              ] as string[]
          ),

          // Price range
          ProductModel.findMany({ limit: 1000 }).then((result) => {
            const prices = result.products.flatMap(
              (p) =>
                p.variants?.map((v) => v.price || p.base_price) || [
                  p.base_price,
                ]
            );
            return {
              min: Math.min(...prices),
              max: Math.max(...prices),
            };
          }),

          // Attributes (colors, sizes, materials)
          ProductModel.findMany({ limit: 1000 }).then((result) => {
            const colors = new Set<string>();
            const sizes = new Set<string>();
            const materials = new Set<string>();

            result.products.forEach((product) => {
              product.available_colors?.forEach((color) => colors.add(color));
              product.available_sizes?.forEach((size) => sizes.add(size));
              product.available_materials?.forEach((material) =>
                materials.add(material)
              );
            });

            return {
              colors: Array.from(colors),
              sizes: Array.from(sizes),
              materials: Array.from(materials),
            };
          }),
        ]);

      return {
        categories: categoriesResult,
        brands: brandsResult,
        price_range: priceResult,
        colors: attributesResult.colors,
        sizes: attributesResult.sizes,
        materials: attributesResult.materials,
      };
    } catch (error) {
      console.error("Error getting filter options:", error);
      // Return empty filters if error
      return {
        categories: [],
        brands: [],
        price_range: { min: 0, max: 0 },
        colors: [],
        sizes: [],
        materials: [],
      };
    }
  }
}
