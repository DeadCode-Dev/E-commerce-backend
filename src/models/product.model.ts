import pg from "../config/postgres";
import Product from "../types/product/products.entity";

// Enhanced interfaces for product-variant relationships
export interface ProductWithAvailableVariants {
  // Product base info
  id: number;
  name: string;
  description: string;

  // Images (all variants share same product images)
  images: Array<{
    id: number;
    image_url: string;
    alt_text: string;
    display_order: number;
  }>;

  // Categories
  categories: string[];

  // Available variants with stock/pricing
  available_variants: Array<{
    variant_id: number;
    size: string | null;
    color: string | null;
    stock: number;
    price: number; // variant specific price
    is_available: boolean;
  }>;

  // Variant selection options (what combinations are possible)
  variant_options: {
    sizes: string[];
    colors: string[];
    // Shows which combinations actually exist and have stock
    available_combinations: Array<{
      size: string | null;
      color: string | null;
      variant_id: number;
      stock: number;
      price: number;
    }>;
  };

  // Price range across all variants
  price_range: {
    min_price: number;
    max_price: number;
  };

  // Aggregated stock info
  total_stock: number;
  is_available: boolean; // true if any variant has stock > 0
}

export interface VariantAvailability {
  variant_id: number;
  product_id: number;
  product_name: string;
  size: string | null;
  color: string | null;
  stock: number;
  price: number;
  is_available: boolean;
  image_url?: string;
}

export interface ProductSearchOptions {
  name?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  inStock?: boolean;
  sortBy?: "name" | "price" | "created_at" | "popularity";
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

export default class ProductModel {
  static db = pg;

  // ==================== Product Display Methods ====================

  /**
   * Get product with all available variants for product page display
   * This is what users see when they click on a product
   */
  static async getProductWithVariants(
    productId: number
  ): Promise<ProductWithAvailableVariants | null> {
    const query = `
            SELECT 
                p.id as product_id,
                p.name as product_name,
                p.description,
                
                -- Variants info
                pv.id as variant_id,
                pv.size,
                pv.color,
                pv.stock,
                pv.price as variant_price,
                
                -- Images
                img.id as image_id,
                img.image_url,
                img.alt_text,
                img.display_order,
                
                -- Categories
                cat.name as category_name
                
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            LEFT JOIN image img ON p.id = img.product_id
            LEFT JOIN category cat ON p.id = cat.product_id
            WHERE p.id = $1
            ORDER BY pv.id, img.display_order, cat.name
        `;

    try {
      const result = await this.db.query(query, [productId]);
      if (result.rows.length === 0) return null;

      const rows = result.rows;
      const product = rows[0];

      // Group data
      const variants = new Map<
        number,
        {
          variant_id: number;
          size: string | null;
          color: string | null;
          stock: number;
          price: number;
          is_available: boolean;
        }
      >();
      const images = new Map<
        number,
        {
          id: number;
          image_url: string;
          alt_text: string;
          display_order: number;
        }
      >();
      const categories = new Set<string>();

      rows.forEach((row) => {
        // Collect variants
        if (row.variant_id && !variants.has(row.variant_id)) {
          variants.set(row.variant_id, {
            variant_id: row.variant_id,
            size: row.size,
            color: row.color,
            stock: row.stock,
            price: parseFloat(row.variant_price),
            is_available: row.stock > 0,
          });
        }

        // Collect images
        if (row.image_id && !images.has(row.image_id)) {
          images.set(row.image_id, {
            id: row.image_id,
            image_url: row.image_url,
            alt_text: row.alt_text,
            display_order: row.display_order,
          });
        }

        // Collect categories
        if (row.category_name) {
          categories.add(row.category_name);
        }
      });

      const variantArray = Array.from(variants.values());
      const availableVariants = variantArray.filter((v) => v.is_available);

      // Calculate variant options
      const sizes = [
        ...new Set(
          variantArray.map((v) => v.size).filter((s): s is string => s !== null)
        ),
      ];
      const colors = [
        ...new Set(
          variantArray
            .map((v) => v.color)
            .filter((c): c is string => c !== null)
        ),
      ];

      // Calculate price range
      const prices = variantArray.map((v) => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      return {
        id: product.product_id,
        name: product.product_name,
        description: product.description,
        images: Array.from(images.values()).sort(
          (a, b) => a.display_order - b.display_order
        ),
        categories: Array.from(categories),
        available_variants: availableVariants,
        variant_options: {
          sizes,
          colors,
          available_combinations: availableVariants.map((v) => ({
            size: v.size,
            color: v.color,
            variant_id: v.variant_id,
            stock: v.stock,
            price: v.price,
          })),
        },
        price_range: {
          min_price: minPrice,
          max_price: maxPrice,
        },
        total_stock: variantArray.reduce((sum, v) => sum + v.stock, 0),
        is_available: availableVariants.length > 0,
      };
    } catch (error) {
      throw new Error(
        `Error getting product with variants: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if a specific variant combination exists and is available
   */
  static async checkVariantAvailability(
    productId: number,
    size?: string,
    color?: string
  ): Promise<VariantAvailability | null> {
    let whereClause = "WHERE pv.product_id = $1";
    const values: (string | number)[] = [productId];
    let paramCount = 1;

    if (size) {
      whereClause += ` AND pv.size = $${++paramCount}`;
      values.push(size);
    }

    if (color) {
      whereClause += ` AND pv.color = $${++paramCount}`;
      values.push(color);
    }

    const query = `
            SELECT 
                pv.id as variant_id,
                pv.product_id,
                p.name as product_name,
                pv.size,
                pv.color,
                pv.stock,
                pv.price,
                pv.stock > 0 as is_available,
                (SELECT image_url FROM image WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            ${whereClause}
            LIMIT 1
        `;

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        variant_id: row.variant_id,
        product_id: row.product_id,
        product_name: row.product_name,
        size: row.size,
        color: row.color,
        stock: row.stock,
        price: parseFloat(row.price),
        is_available: row.is_available,
        image_url: row.image_url,
      };
    } catch (error) {
      throw new Error(
        `Error checking variant availability: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get variant by specific variant ID (for cart/order operations)
   */
  static async getVariantById(
    variantId: number
  ): Promise<VariantAvailability | null> {
    const query = `
            SELECT 
                pv.id as variant_id,
                pv.product_id,
                p.name as product_name,
                pv.size,
                pv.color,
                pv.stock,
                pv.price,
                pv.stock > 0 as is_available,
                (SELECT image_url FROM image WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE pv.id = $1
        `;

    try {
      const result = await this.db.query(query, [variantId]);
      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        variant_id: row.variant_id,
        product_id: row.product_id,
        product_name: row.product_name,
        size: row.size,
        color: row.color,
        stock: row.stock,
        price: parseFloat(row.price),
        is_available: row.is_available,
        image_url: row.image_url,
      };
    } catch (error) {
      throw new Error(
        `Error getting variant by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Product Search & Listing ====================

  /**
   * Search products with variant-aware filtering
   */
  static async searchProducts(options: ProductSearchOptions): Promise<{
    products: ProductWithAvailableVariants[];
    total: number;
  }> {
    let whereClause = "WHERE 1=1";
    let havingClause = "";
    const values: (string | number)[] = [];
    let paramCount = 0;

    // Name search
    if (options.name) {
      whereClause += ` AND p.name ILIKE $${++paramCount}`;
      values.push(`%${options.name}%`);
    }

    // Category filter
    if (options.category) {
      whereClause += ` AND EXISTS (SELECT 1 FROM category c WHERE c.product_id = p.id AND c.name = $${++paramCount})`;
      values.push(options.category);
    }

    // Price range filter (applies to variants)
    if (options.minPrice !== undefined) {
      havingClause += havingClause ? " AND " : " HAVING ";
      havingClause += `MIN(pv.price) >= $${++paramCount}`;
      values.push(options.minPrice);
    }

    if (options.maxPrice !== undefined) {
      havingClause += havingClause ? " AND " : " HAVING ";
      havingClause += `MAX(pv.price) <= $${++paramCount}`;
      values.push(options.maxPrice);
    }

    // Size/Color filter
    if (options.size) {
      whereClause += ` AND EXISTS (SELECT 1 FROM product_variants pv2 WHERE pv2.product_id = p.id AND pv2.size = $${++paramCount})`;
      values.push(options.size);
    }

    if (options.color) {
      whereClause += ` AND EXISTS (SELECT 1 FROM product_variants pv3 WHERE pv3.product_id = p.id AND pv3.color = $${++paramCount})`;
      values.push(options.color);
    }

    // Stock filter
    if (options.inStock) {
      whereClause += ` AND EXISTS (SELECT 1 FROM product_variants pv4 WHERE pv4.product_id = p.id AND pv4.stock > 0)`;
    }

    // Build sort clause
    let orderClause = "ORDER BY ";
    switch (options.sortBy) {
      case "name":
        orderClause += "p.name";
        break;
      case "price":
        orderClause += "MIN(pv.price)";
        break;
      case "popularity":
        orderClause += "total_stock DESC, p.name";
        break;
      case "created_at":
      default:
        orderClause += "p.id";
        break;
    }
    orderClause += ` ${options.sortOrder || "ASC"}`;

    // Pagination
    let limitClause = "";
    if (options.limit) {
      limitClause += ` LIMIT $${++paramCount}`;
      values.push(options.limit);
    }
    if (options.offset) {
      limitClause += ` OFFSET $${++paramCount}`;
      values.push(options.offset);
    }

    const query = `
            SELECT 
                p.id,
                p.name,
                p.description,
                MIN(pv.price) as min_price,
                MAX(pv.price) as max_price,
                SUM(pv.stock) as total_stock,
                SUM(CASE WHEN pv.stock > 0 THEN 1 ELSE 0 END) as available_variants_count
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            ${whereClause}
            GROUP BY p.id, p.name, p.description
            ${havingClause}
            ${orderClause}
            ${limitClause}
        `;

    try {
      const result = await this.db.query(query, values);
      const productIds = result.rows.map((row) => row.id);

      if (productIds.length === 0) {
        return { products: [], total: 0 };
      }

      // Get full product details for found products
      const products = await Promise.all(
        productIds.map((id) => this.getProductWithVariants(id))
      );

      // Get total count for pagination
      const countQuery = `
                SELECT COUNT(DISTINCT p.id) as total
                FROM products p
                LEFT JOIN product_variants pv ON p.id = pv.product_id
                ${whereClause}
                ${havingClause.replace("HAVING", "GROUP BY p.id HAVING")}
            `;

      const countResult = await this.db.query(countQuery, values.slice(0, -2)); // Remove limit/offset
      const total = parseInt(countResult.rows[0]?.total || "0");

      return {
        products: products.filter(Boolean) as ProductWithAvailableVariants[],
        total,
      };
    } catch (error) {
      throw new Error(
        `Error searching products: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all available sizes for a product (for frontend dropdowns)
   */
  static async getProductSizes(productId: number): Promise<string[]> {
    const query = `
            SELECT DISTINCT size
            FROM product_variants 
            WHERE product_id = $1 AND size IS NOT NULL AND stock > 0
            ORDER BY size
        `;

    try {
      const result = await this.db.query(query, [productId]);
      return result.rows.map((row) => row.size) || [];
    } catch (error) {
      throw new Error(
        `Error getting product sizes: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all available colors for a product (for frontend dropdowns)
   */
  static async getProductColors(productId: number): Promise<string[]> {
    const query = `
            SELECT DISTINCT color
            FROM product_variants 
            WHERE product_id = $1 AND color IS NOT NULL AND stock > 0
            ORDER BY color
        `;

    try {
      const result = await this.db.query(query, [productId]);
      return result.rows.map((row) => row.color) || [];
    } catch (error) {
      throw new Error(
        `Error getting product colors: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get available colors for a specific size (progressive filtering)
   */
  static async getAvailableColorsForSize(
    productId: number,
    size: string
  ): Promise<string[]> {
    const query = `
            SELECT DISTINCT color
            FROM product_variants 
            WHERE product_id = $1 AND size = $2 AND color IS NOT NULL AND stock > 0
            ORDER BY color
        `;

    try {
      const result = await this.db.query(query, [productId, size]);
      return result.rows.map((row) => row.color) || [];
    } catch (error) {
      throw new Error(
        `Error getting available colors for size: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get available sizes for a specific color (progressive filtering)
   */
  static async getAvailableSizesForColor(
    productId: number,
    color: string
  ): Promise<string[]> {
    const query = `
            SELECT DISTINCT size
            FROM product_variants 
            WHERE product_id = $1 AND color = $2 AND size IS NOT NULL AND stock > 0
            ORDER BY size
        `;

    try {
      const result = await this.db.query(query, [productId, color]);
      return result.rows.map((row) => row.size) || [];
    } catch (error) {
      throw new Error(
        `Error getting available sizes for color: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Basic CRUD Operations ====================

  static async createProduct(
    data: Pick<Product, "name" | "description">
  ): Promise<Product> {
    const query = `
            INSERT INTO products (name, description) 
            VALUES ($1, $2) 
            RETURNING *
        `;
    const values = [data.name, data.description];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating product: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateProduct(
    id: number,
    data: Partial<Product>
  ): Promise<Product | null> {
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Product] !== undefined &&
        data[key as keyof Product] !== null &&
        data[key as keyof Product] !== ""
    );

    if (dataKeys.length === 0) return null;

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Product]);
    values.push(id);

    const query = `
            UPDATE products 
            SET ${setClause} 
            WHERE id = $${dataKeys.length + 1} 
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating product: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteProduct(id: number): Promise<void> {
    // Note: This will cascade delete all variants, images, categories due to FK constraints
    const query = `DELETE FROM products WHERE id = $1 cascade`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting product: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getAllProducts(): Promise<Product[]> {
    const query = `SELECT * FROM products ORDER BY id`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting all products: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getProductById(id: number): Promise<Product | null> {
    const query = `SELECT * FROM products WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error getting product by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
