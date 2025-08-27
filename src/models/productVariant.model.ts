import pg from "../config/postgres";
import ProductVariant from "../types/product/variant.entity";

export interface VariantSearchOptions {
  productId?: number;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "price" | "size" | "color" | "stock";
  sortOrder?: "ASC" | "DESC";
}

export default class ProductVariantModel {
  static db = pg;

  // ==================== Basic CRUD Operations ====================

  static async createVariant(
    data: Partial<ProductVariant>
  ): Promise<ProductVariant> {
    const query = `
            INSERT INTO product_variants (product_id, size, color, stock, price) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `;
    const values = [
      data.product_id,
      data.size,
      data.color,
      data.stock || 0,
      data.price,
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating variant: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findVariantById(id: number): Promise<ProductVariant | null> {
    const query = `SELECT * FROM product_variants WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding variant by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findVariantsByProductId(
    productId: number
  ): Promise<ProductVariant[]> {
    const query = `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id`;
    const values = [productId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding variants by product id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getAllVariants(): Promise<ProductVariant[]> {
    const query = `SELECT * FROM product_variants ORDER BY product_id, id`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting all variants: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateVariant(
    id: number,
    data: Partial<ProductVariant>
  ): Promise<ProductVariant | null> {
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof ProductVariant] !== undefined &&
        data[key as keyof ProductVariant] !== null
    );

    if (dataKeys.length === 0) return null;

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof ProductVariant]);
    values.push(id);

    const query = `
            UPDATE product_variants 
            SET ${setClause}, updated_at = NOW() 
            WHERE id = $${dataKeys.length + 1} 
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating variant: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteVariant(id: number): Promise<void> {
    const query = `DELETE FROM product_variants WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting variant: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteVariantsByProductId(productId: number): Promise<void> {
    const query = `DELETE FROM product_variants WHERE product_id = $1`;
    const values = [productId];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting variants by product id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Advanced Search and Filtering ====================

  static async searchVariants(
    options: VariantSearchOptions
  ): Promise<ProductVariant[]> {
    let baseQuery = `SELECT * FROM product_variants WHERE 1=1`;
    const values: any[] = [];
    let paramCounter = 1;

    if (options.productId) {
      baseQuery += ` AND product_id = $${paramCounter}`;
      values.push(options.productId);
      paramCounter++;
    }

    if (options.size) {
      baseQuery += ` AND size = $${paramCounter}`;
      values.push(options.size);
      paramCounter++;
    }

    if (options.color) {
      baseQuery += ` AND color = $${paramCounter}`;
      values.push(options.color);
      paramCounter++;
    }

    if (options.minPrice !== undefined) {
      baseQuery += ` AND price >= $${paramCounter}`;
      values.push(options.minPrice);
      paramCounter++;
    }

    if (options.maxPrice !== undefined) {
      baseQuery += ` AND price <= $${paramCounter}`;
      values.push(options.maxPrice);
      paramCounter++;
    }

    if (options.inStock) {
      baseQuery += ` AND stock > 0`;
    }

    // Add sorting
    const sortBy = options.sortBy || "id";
    const sortOrder = options.sortOrder || "ASC";
    baseQuery += ` ORDER BY ${sortBy} ${sortOrder}`;

    try {
      const result = await this.db.query(baseQuery, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error searching variants: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findVariantByProductAndAttributes(
    productId: number,
    size?: string,
    color?: string
  ): Promise<ProductVariant | null> {
    let query = `SELECT * FROM product_variants WHERE product_id = $1`;
    const values: any[] = [productId];
    let paramCounter = 2;

    if (size) {
      query += ` AND size = $${paramCounter}`;
      values.push(size);
      paramCounter++;
    }

    if (color) {
      query += ` AND color = $${paramCounter}`;
      values.push(color);
      paramCounter++;
    }

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding variant by attributes: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getVariantsBySize(size: string): Promise<ProductVariant[]> {
    const query = `SELECT * FROM product_variants WHERE size = $1 ORDER BY product_id`;
    const values = [size];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting variants by size: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getVariantsByColor(color: string): Promise<ProductVariant[]> {
    const query = `SELECT * FROM product_variants WHERE color = $1 ORDER BY product_id`;
    const values = [color];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting variants by color: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getVariantsInStock(): Promise<ProductVariant[]> {
    const query = `SELECT * FROM product_variants WHERE stock > 0 ORDER BY product_id, id`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting variants in stock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getVariantsOutOfStock(): Promise<ProductVariant[]> {
    const query = `SELECT * FROM product_variants WHERE stock = 0 ORDER BY product_id, id`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting variants out of stock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getVariantsInPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<ProductVariant[]> {
    const query = `
            SELECT * FROM product_variants 
            WHERE price BETWEEN $1 AND $2 
            ORDER BY price ASC
        `;
    const values = [minPrice, maxPrice];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting variants in price range: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Stock Management ====================

  static async updateStock(
    id: number,
    stock: number
  ): Promise<ProductVariant | null> {
    const query = `
            UPDATE product_variants 
            SET stock = $1, updated_at = NOW() 
            WHERE id = $2 
            RETURNING *
        `;
    const values = [stock, id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating stock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async increaseStock(
    id: number,
    amount: number
  ): Promise<ProductVariant | null> {
    const query = `
            UPDATE product_variants 
            SET stock = stock + $1, updated_at = NOW() 
            WHERE id = $2 
            RETURNING *
        `;
    const values = [amount, id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error increasing stock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async decreaseStock(
    id: number,
    amount: number
  ): Promise<ProductVariant | null> {
    const query = `
            UPDATE product_variants 
            SET stock = GREATEST(stock - $1, 0), updated_at = NOW() 
            WHERE id = $2 
            RETURNING *
        `;
    const values = [amount, id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error decreasing stock: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Analytics ====================

  static async getVariantStatistics(): Promise<any> {
    const query = `
            SELECT 
                COUNT(*) as total_variants,
                COUNT(DISTINCT size) as total_sizes,
                COUNT(DISTINCT color) as total_colors,
                AVG(price) as average_price,
                MAX(price) as max_price,
                MIN(price) as min_price,
                SUM(stock) as total_stock,
                COUNT(*) FILTER (WHERE stock > 0) as in_stock_count,
                COUNT(*) FILTER (WHERE stock = 0) as out_of_stock_count
            FROM product_variants
        `;

    try {
      const result = await this.db.query(query);
      return result.rows[0] || {};
    } catch (error) {
      throw new Error(
        `Error getting variant statistics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getUniqueAttributes(): Promise<{
    sizes: string[];
    colors: string[];
  }> {
    const sizesQuery = `SELECT DISTINCT size FROM product_variants WHERE size IS NOT NULL ORDER BY size`;
    const colorsQuery = `SELECT DISTINCT color FROM product_variants WHERE color IS NOT NULL ORDER BY color`;

    try {
      const [sizesResult, colorsResult] = await Promise.all([
        this.db.query(sizesQuery),
        this.db.query(colorsQuery),
      ]);

      return {
        sizes: sizesResult.rows.map((row) => row.size) || [],
        colors: colorsResult.rows.map((row) => row.color) || [],
      };
    } catch (error) {
      throw new Error(
        `Error getting unique attributes: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Bulk Operations ====================

  static async createMultipleVariants(
    variants: Partial<ProductVariant>[]
  ): Promise<ProductVariant[]> {
    if (variants.length === 0) return [];

    const valueStrings = variants
      .map((_, index) => {
        const offset = index * 5;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
      })
      .join(", ");

    const values = variants.flatMap((variant) => [
      variant.product_id,
      variant.size,
      variant.color,
      variant.stock || 0,
      variant.price,
    ]);

    const query = `
            INSERT INTO product_variants (product_id, size, color, stock, price)
            VALUES ${valueStrings}
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error creating multiple variants: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
