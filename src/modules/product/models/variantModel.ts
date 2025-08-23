// src/modules/product/models/variantModel.ts
import pool from "../../../config/postgres";
import {
  ProductVariant,
  CreateVariantRequest,
  StockOperation,
} from "../../../types/product/products.entity";
import { VariantRow } from "../types/database";

export class VariantModel {
  /**
   * Find variant by ID
   */
  static async findById(id: number): Promise<ProductVariant | null> {
    try {
      const query = `
        SELECT * FROM product_variants 
        WHERE id = $1 AND is_active = true
      `;

      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return null;

      return this.mapRowToVariant(result.rows[0]);
    } catch (error) {
      console.error("Error finding variant by ID:", error);
      throw new Error("Failed to find variant");
    }
  }

  /**
   * Find variant by SKU
   */
  static async findBySku(sku: string): Promise<ProductVariant | null> {
    try {
      const query = `
        SELECT * FROM product_variants 
        WHERE sku = $1 AND is_active = true
      `;

      const result = await pool.query(query, [sku]);
      if (result.rows.length === 0) return null;

      return this.mapRowToVariant(result.rows[0]);
    } catch (error) {
      console.error("Error finding variant by SKU:", error);
      throw new Error("Failed to find variant");
    }
  }

  /**
   * Find variants by product ID
   */
  static async findByProductId(
    productId: number,
    activeOnly = true
  ): Promise<ProductVariant[]> {
    try {
      const query = `
        SELECT * FROM product_variants 
        WHERE product_id = $1 ${activeOnly ? "AND is_active = true" : ""}
        ORDER BY sort_order ASC, created_at ASC
      `;

      const result = await pool.query(query, [productId]);
      return result.rows.map((row) => this.mapRowToVariant(row));
    } catch (error) {
      console.error("Error finding variants by product ID:", error);
      throw new Error("Failed to find variants");
    }
  }

  /**
   * Check stock for specific variant combination
   */
  static async checkStock(
    productId: number,
    color?: string,
    size?: string,
    material?: string
  ): Promise<number> {
    try {
      const conditions = ["product_id = $1", "is_active = true"];
      const values: (string | number)[] = [productId];
      let paramCount = 1;

      if (color) {
        conditions.push(`color = $${++paramCount}`);
        values.push(color);
      }

      if (size) {
        conditions.push(`size = $${++paramCount}`);
        values.push(size);
      }

      if (material) {
        conditions.push(`material = $${++paramCount}`);
        values.push(material);
      }

      const query = `
        SELECT (stock - reserved_stock) as available_stock 
        FROM product_variants 
        WHERE ${conditions.join(" AND ")}
      `;

      const result = await pool.query(query, values);
      return result.rows[0]?.available_stock || 0;
    } catch (error) {
      console.error("Error checking variant stock:", error);
      throw new Error("Failed to check stock");
    }
  }

  /**
   * Get available sizes for a specific color
   */
  static async getAvailableSizesForColor(
    productId: number,
    color: string
  ): Promise<{ size: string; stock: number; price: number }[]> {
    try {
      const query = `
        SELECT 
          size, 
          (stock - reserved_stock) as available_stock,
          COALESCE(price, (SELECT base_price FROM products WHERE id = $1)) as price
        FROM product_variants 
        WHERE product_id = $1 AND color = $2 AND is_active = true 
        AND (stock - reserved_stock) > 0
        ORDER BY sort_order ASC
      `;

      const result = await pool.query(query, [productId, color]);
      return result.rows.map((row) => ({
        size: row.size,
        stock: row.available_stock,
        price: parseFloat(row.price),
      }));
    } catch (error) {
      console.error("Error fetching available sizes:", error);
      throw new Error("Failed to fetch available sizes");
    }
  }

  /**
   * Get available colors for a specific size
   */
  static async getAvailableColorsForSize(
    productId: number,
    size: string
  ): Promise<{ color: string; stock: number; price: number }[]> {
    try {
      const query = `
        SELECT 
          color, 
          (stock - reserved_stock) as available_stock,
          COALESCE(price, (SELECT base_price FROM products WHERE id = $1)) as price
        FROM product_variants 
        WHERE product_id = $1 AND size = $2 AND is_active = true 
        AND (stock - reserved_stock) > 0
        ORDER BY sort_order ASC
      `;

      const result = await pool.query(query, [productId, size]);
      return result.rows.map((row) => ({
        color: row.color,
        stock: row.available_stock,
        price: parseFloat(row.price),
      }));
    } catch (error) {
      console.error("Error fetching available colors:", error);
      throw new Error("Failed to fetch available colors");
    }
  }

  /**
   * Get variant by exact attributes
   */
  static async findByAttributes(
    productId: number,
    color?: string,
    size?: string,
    material?: string
  ): Promise<ProductVariant | null> {
    try {
      const conditions = ["product_id = $1", "is_active = true"];
      const values: (string | number)[] = [productId];
      let paramCount = 1;

      if (color) {
        conditions.push(`color = $${++paramCount}`);
        values.push(color);
      }

      if (size) {
        conditions.push(`size = $${++paramCount}`);
        values.push(size);
      }

      if (material) {
        conditions.push(`material = $${++paramCount}`);
        values.push(material);
      }

      const query = `
        SELECT * FROM product_variants 
        WHERE ${conditions.join(" AND ")}
        LIMIT 1
      `;

      const result = await pool.query(query, values);
      if (result.rows.length === 0) return null;

      return this.mapRowToVariant(result.rows[0]);
    } catch (error) {
      console.error("Error finding variant by attributes:", error);
      throw new Error("Failed to find variant");
    }
  }

  /**
   * Create a new variant
   */
  static async create(
    productId: number,
    variantData: CreateVariantRequest
  ): Promise<ProductVariant> {
    try {
      const query = `
        INSERT INTO product_variants (
          product_id, sku, color, size, material, price, cost_price,
          stock, weight, barcode, supplier_sku, is_default, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        productId,
        variantData.sku,
        variantData.color,
        variantData.size,
        variantData.material,
        variantData.price,
        variantData.cost_price,
        variantData.stock,
        variantData.weight,
        variantData.barcode,
        variantData.supplier_sku,
        variantData.is_default || false,
        variantData.sort_order || 0,
      ];

      const result = await pool.query(query, values);
      return this.mapRowToVariant(result.rows[0]);
    } catch (error) {
      console.error("Error creating variant:", error);
      if (error instanceof Error && "code" in error && error.code === "23505") {
        throw new Error("Variant with this SKU or attributes already exists");
      }
      throw new Error("Failed to create variant");
    }
  }

  /**
   * Update variant
   */
  static async update(
    id: number,
    variantData: Partial<CreateVariantRequest>
  ): Promise<ProductVariant | null> {
    try {
      const fields: string[] = [];
      const values: (string | number | boolean)[] = [];
      let paramCount = 0;

      // Build dynamic update query
      Object.entries(variantData).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = $${++paramCount}`);
          values.push(value);
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      fields.push(`updated_at = NOW()`);

      const query = `
        UPDATE product_variants 
        SET ${fields.join(", ")}
        WHERE id = $${++paramCount} AND is_active = true
        RETURNING *
      `;

      values.push(id);

      const result = await pool.query(query, values);
      if (result.rows.length === 0) return null;

      return this.mapRowToVariant(result.rows[0]);
    } catch (error) {
      console.error("Error updating variant:", error);
      throw new Error("Failed to update variant");
    }
  }

  /**
   * Stock operations
   */
  static async manageStock(operation: StockOperation): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      switch (operation.operation) {
        case "reserve": {
          const reserveResult = await client.query(
            "SELECT reserve_variant_stock($1, $2)",
            [operation.variant_id, operation.quantity]
          );
          const reserved = reserveResult.rows[0].reserve_variant_stock;
          if (!reserved) {
            throw new Error("Insufficient stock to reserve");
          }
          break;
        }

        case "release": {
          await client.query("SELECT release_variant_stock($1, $2)", [
            operation.variant_id,
            operation.quantity,
          ]);
          break;
        }

        case "fulfill": {
          const fulfillResult = await client.query(
            "SELECT fulfill_variant_stock($1, $2)",
            [operation.variant_id, operation.quantity]
          );
          const fulfilled = fulfillResult.rows[0].fulfill_variant_stock;
          if (!fulfilled) {
            throw new Error("Insufficient reserved stock to fulfill");
          }
          break;
        }

        case "adjust": {
          await client.query(
            "UPDATE product_variants SET stock = stock + $2, updated_at = NOW() WHERE id = $1",
            [operation.variant_id, operation.quantity]
          );
          break;
        }

        default:
          throw new Error("Invalid stock operation");
      }

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error managing stock:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get low stock variants
   */
  static async getLowStockVariants(
    productId?: number
  ): Promise<ProductVariant[]> {
    try {
      const baseQuery = `
        SELECT pv.*, p.name as product_name
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.stock <= pv.min_stock_alert 
        AND pv.is_active = true
        AND p.status = 'active'
      `;

      const query = productId
        ? `${baseQuery} AND pv.product_id = $1 ORDER BY pv.stock ASC`
        : `${baseQuery} ORDER BY pv.stock ASC`;

      const values = productId ? [productId] : [];
      const result = await pool.query(query, values);

      return result.rows.map((row) => this.mapRowToVariant(row));
    } catch (error) {
      console.error("Error fetching low stock variants:", error);
      throw new Error("Failed to fetch low stock variants");
    }
  }

  /**
   * Delete variant (soft delete)
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const query = `
        UPDATE product_variants 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);
      return result.rowCount! > 0;
    } catch (error) {
      console.error("Error deleting variant:", error);
      throw new Error("Failed to delete variant");
    }
  }

  /**
   * Map database row to ProductVariant interface
   */
  private static mapRowToVariant(row: VariantRow): ProductVariant {
    return {
      id: row.id,
      product_id: row.product_id,
      sku: row.sku,
      color: row.color,
      size: row.size,
      material: row.material,
      price: row.price,
      cost_price: row.cost_price,
      stock: row.stock,
      reserved_stock: row.reserved_stock,
      min_stock_alert: row.min_stock_alert,
      weight: row.weight,
      barcode: row.barcode,
      supplier_sku: row.supplier_sku,
      is_active: row.is_active,
      is_default: row.is_default,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
