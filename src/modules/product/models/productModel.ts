// src/modules/product/models/productModel.ts
import pool from "../../../config/postgres";
import Product, {
  ProductWithVariants,
  CreateProductRequest,
} from "../../../types/product/products.entity";
import { ProductRow, VariantRow, ImageRow } from "../types/database";

export class ProductModel {
  /**
   * Find product by ID with basic information
   */
  static async findById(id: number): Promise<Product | null> {
    try {
      const query = `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return null;

      return this.mapRowToProduct(result.rows[0]);
    } catch (error) {
      console.error("Error finding product by ID:", error);
      throw new Error("Failed to find product");
    }
  }

  /**
   * Find product by slug
   */
  static async findBySlug(slug: string): Promise<Product | null> {
    try {
      const query = `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = $1 AND p.status = 'active'
      `;

      const result = await pool.query(query, [slug]);
      if (result.rows.length === 0) return null;

      return this.mapRowToProduct(result.rows[0]);
    } catch (error) {
      console.error("Error finding product by slug:", error);
      throw new Error("Failed to find product");
    }
  }

  /**
   * Get product with all variants and related data
   */
  static async findWithVariants(
    id: number
  ): Promise<ProductWithVariants | null> {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          c.slug as category_slug,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pv.id,
              'sku', pv.sku,
              'color', pv.color,
              'size', pv.size,
              'material', pv.material,
              'price', COALESCE(pv.price, p.base_price),
              'cost_price', pv.cost_price,
              'stock', pv.stock,
              'reserved_stock', pv.reserved_stock,
              'min_stock_alert', pv.min_stock_alert,
              'weight', pv.weight,
              'barcode', pv.barcode,
              'supplier_sku', pv.supplier_sku,
              'is_active', pv.is_active,
              'is_default', pv.is_default,
              'sort_order', pv.sort_order,
              'created_at', pv.created_at,
              'updated_at', pv.updated_at
            )
          ) FILTER (WHERE pv.id IS NOT NULL) as variants,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pi.id,
              'variant_id', pi.variant_id,
              'image_url', pi.image_url,
              'alt_text', pi.alt_text,
              'image_type', pi.image_type,
              'sort_order', pi.sort_order,
              'is_primary', pi.is_primary,
              'file_size', pi.file_size,
              'width', pi.width,
              'height', pi.height,
              'created_at', pi.created_at
            )
          ) FILTER (WHERE pi.id IS NOT NULL) as images
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE p.id = $1 AND p.status = 'active'
        GROUP BY p.id, c.name, c.slug
      `;

      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return null;

      return this.mapRowToProductWithVariants(result.rows[0]);
    } catch (error) {
      console.error("Error finding product with variants:", error);
      throw new Error("Failed to find product with variants");
    }
  }

  /**
   * Get products with filters and pagination
   */
  static async findMany(options: {
    page?: number;
    limit?: number;
    category_id?: number;
    brand?: string;
    status?: string;
    is_featured?: boolean;
    search?: string;
    min_price?: number;
    max_price?: number;
    colors?: string[];
    sizes?: string[];
    in_stock_only?: boolean;
  }): Promise<{ products: ProductWithVariants[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        category_id,
        brand,
        status = "active",
        is_featured,
        search,
        min_price,
        max_price,
        colors,
        sizes,
        in_stock_only,
      } = options;

      const offset = (page - 1) * limit;
      const conditions: string[] = [`p.status = $1`];
      const values: (string | number | boolean | string[])[] = [status];
      let paramCount = 1;

      // Build WHERE conditions
      if (category_id) {
        conditions.push(`p.category_id = $${++paramCount}`);
        values.push(category_id);
      }

      if (brand) {
        conditions.push(`p.brand ILIKE $${++paramCount}`);
        values.push(`%${brand}%`);
      }

      if (is_featured !== undefined) {
        conditions.push(`p.is_featured = $${++paramCount}`);
        values.push(is_featured);
      }

      if (search) {
        conditions.push(
          `(p.name ILIKE $${++paramCount} OR p.description ILIKE $${++paramCount})`
        );
        values.push(`%${search}%`, `%${search}%`);
        paramCount++; // Account for two parameters
      }

      if (min_price) {
        conditions.push(`p.base_price >= $${++paramCount}`);
        values.push(min_price);
      }

      if (max_price) {
        conditions.push(`p.base_price <= $${++paramCount}`);
        values.push(max_price);
      }

      if (colors && colors.length > 0) {
        conditions.push(`EXISTS (
          SELECT 1 FROM product_variants pv2 
          WHERE pv2.product_id = p.id 
          AND pv2.color = ANY($${++paramCount})
          AND pv2.is_active = true
        )`);
        values.push(colors);
      }

      if (sizes && sizes.length > 0) {
        conditions.push(`EXISTS (
          SELECT 1 FROM product_variants pv3 
          WHERE pv3.product_id = p.id 
          AND pv3.size = ANY($${++paramCount})
          AND pv3.is_active = true
        )`);
        values.push(sizes);
      }

      if (in_stock_only) {
        conditions.push(`EXISTS (
          SELECT 1 FROM product_variants pv4 
          WHERE pv4.product_id = p.id 
          AND (pv4.stock - pv4.reserved_stock) > 0
          AND pv4.is_active = true
        )`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Main query
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          c.slug as category_slug,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pv.id,
              'sku', pv.sku,
              'color', pv.color,
              'size', pv.size,
              'material', pv.material,
              'price', COALESCE(pv.price, p.base_price),
              'stock', pv.stock,
              'reserved_stock', pv.reserved_stock,
              'is_active', pv.is_active,
              'is_default', pv.is_default
            )
          ) FILTER (WHERE pv.id IS NOT NULL) as variants,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pi.id,
              'variant_id', pi.variant_id,
              'image_url', pi.image_url,
              'alt_text', pi.alt_text,
              'image_type', pi.image_type,
              'is_primary', pi.is_primary
            )
          ) FILTER (WHERE pi.id IS NOT NULL) as images
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
        LEFT JOIN product_images pi ON p.id = pi.product_id
        ${whereClause}
        GROUP BY p.id, c.name, c.slug
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      values.push(limit, offset);

      // Count query
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
        ${whereClause}
      `;

      const [productsResult, countResult] = await Promise.all([
        pool.query(query, values),
        pool.query(countQuery, values.slice(0, -2)), // Remove limit and offset for count
      ]);

      const products = productsResult.rows.map((row) =>
        this.mapRowToProductWithVariants(row)
      );
      const total = parseInt(countResult.rows[0].total);

      return { products, total };
    } catch (error) {
      console.error("Error finding products:", error);
      throw new Error("Failed to find products");
    }
  }

  /**
   * Create a new product
   */
  static async create(productData: CreateProductRequest): Promise<Product> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Generate slug if not provided
      const slug = productData.slug || this.generateSlug(productData.name);

      // Insert product
      const productQuery = `
        INSERT INTO products (
          name, slug, description, short_description, base_price, category_id,
          brand, sku_prefix, weight, dimensions, meta_title, meta_description,
          status, is_featured, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const productValues = [
        productData.name,
        slug,
        productData.description,
        productData.short_description,
        productData.base_price,
        productData.category_id,
        productData.brand,
        productData.sku_prefix,
        productData.weight,
        productData.dimensions ? JSON.stringify(productData.dimensions) : null,
        productData.meta_title,
        productData.meta_description,
        productData.status || "active",
        productData.is_featured || false,
        productData.tags || [],
      ];

      const productResult = await client.query(productQuery, productValues);
      const product = productResult.rows[0];

      // Insert variants
      if (productData.variants && productData.variants.length > 0) {
        for (const [index, variant] of productData.variants.entries()) {
          const variantSku =
            variant.sku ||
            `${productData.sku_prefix}-${variant.color}-${variant.size}`.toUpperCase();

          const variantQuery = `
            INSERT INTO product_variants (
              product_id, sku, color, size, material, price, cost_price,
              stock, weight, barcode, supplier_sku, is_default, sort_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `;

          const variantValues = [
            product.id,
            variantSku,
            variant.color,
            variant.size,
            variant.material,
            variant.price,
            variant.cost_price,
            variant.stock,
            variant.weight,
            variant.barcode,
            variant.supplier_sku,
            variant.is_default || index === 0,
            variant.sort_order || index + 1,
          ];

          await client.query(variantQuery, variantValues);
        }
      }

      await client.query("COMMIT");
      return this.mapRowToProduct(product);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating product:", error);
      throw new Error("Failed to create product");
    } finally {
      client.release();
    }
  }

  /**
   * Update product
   */
  static async update(
    id: number,
    productData: Partial<CreateProductRequest>
  ): Promise<Product | null> {
    try {
      const fields: string[] = [];
      const values: (string | number | boolean | object | string[])[] = [];
      let paramCount = 0;

      // Build dynamic update query
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && key !== "variants" && key !== "images") {
          fields.push(`${key} = $${++paramCount}`);
          values.push(value);
        }
      });

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      fields.push(`updated_at = NOW()`);

      const query = `
        UPDATE products 
        SET ${fields.join(", ")}
        WHERE id = $${++paramCount}
        RETURNING *
      `;

      values.push(id);

      const result = await pool.query(query, values);
      if (result.rows.length === 0) return null;

      return this.mapRowToProduct(result.rows[0]);
    } catch (error) {
      console.error("Error updating product:", error);
      throw new Error("Failed to update product");
    }
  }

  /**
   * Delete product (soft delete by setting status to archived)
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const query = `
        UPDATE products 
        SET status = 'archived', updated_at = NOW()
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);
      return result.rowCount! > 0;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw new Error("Failed to delete product");
    }
  }

  /**
   * Generate slug from product name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Map database row to Product interface
   */
  private static mapRowToProduct(row: ProductRow): Product {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      short_description: row.short_description,
      base_price: parseFloat(row.base_price),
      category_id: row.category_id,
      brand: row.brand,
      sku_prefix: row.sku_prefix,
      weight: row.weight ? parseFloat(row.weight) : undefined,
      dimensions: row.dimensions ? JSON.parse(row.dimensions) : undefined,
      meta_title: row.meta_title,
      meta_description: row.meta_description,
      status: row.status as "active" | "inactive" | "draft" | "archived",
      is_featured: row.is_featured,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      category: row.category_name
        ? {
            id: row.category_id!,
            name: row.category_name,
            slug: row.category_slug!,
            is_active: true,
            sort_order: 0,
            created_at: new Date(),
            updated_at: new Date(),
          }
        : undefined,
    };
  }

  /**
   * Map database row to ProductWithVariants interface
   */
  private static mapRowToProductWithVariants(
    row: ProductRow
  ): ProductWithVariants {
    const product = this.mapRowToProduct(row);
    const variants = (row.variants || []) as VariantRow[];
    const images = (row.images || []) as ImageRow[];

    // Calculate derived fields
    const availableColors = [
      ...new Set(variants.map((v: VariantRow) => v.color).filter(Boolean)),
    ] as string[];
    const availableSizes = [
      ...new Set(variants.map((v: VariantRow) => v.size).filter(Boolean)),
    ] as string[];
    const availableMaterials = [
      ...new Set(variants.map((v: VariantRow) => v.material).filter(Boolean)),
    ] as string[];

    const prices = variants.map(
      (v: VariantRow) => v.price || product.base_price
    );
    const priceRange =
      prices.length > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
          }
        : { min: product.base_price, max: product.base_price };

    const totalStock = variants.reduce(
      (sum: number, v: VariantRow) => sum + (v.stock || 0),
      0
    );
    const availableStock = variants.reduce(
      (sum: number, v: VariantRow) =>
        sum + Math.max(0, (v.stock || 0) - (v.reserved_stock || 0)),
      0
    );

    const lowStockVariants = variants.filter(
      (v: VariantRow) => v.stock <= v.min_stock_alert && v.is_active
    );

    return {
      ...product,
      variants,
      images,
      available_colors: availableColors,
      available_sizes: availableSizes,
      available_materials: availableMaterials,
      price_range: priceRange,
      total_stock: totalStock,
      available_stock: availableStock,
      is_in_stock: availableStock > 0,
      low_stock_variants: lowStockVariants,
    };
  }
}
