import pg from "../config/postgres";
import Category from "../types/product/category.entity";

export default class CategoryModel {
  static db = pg;

  // ==================== Basic CRUD Operations ====================

  static async createCategory(data: Partial<Category>): Promise<Category> {
    const query = `
            INSERT INTO category (name, product_id) 
            VALUES ($1, $2) 
            RETURNING *
        `;
    const values = [data.name, data.product_id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating category: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findCategoryById(id: number): Promise<Category | null> {
    const query = `SELECT * FROM category WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding category by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findCategoriesByProductId(
    productId: number
  ): Promise<Category[]> {
    const query = `SELECT * FROM category WHERE product_id = $1 ORDER BY name`;
    const values = [productId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding categories by product id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getUniqueCategoryNames(): Promise<string[]> {
    const query = `SELECT DISTINCT name FROM category ORDER BY name`;

    try {
      const result = await this.db.query(query);
      return result.rows.map((row) => row.name) || [];
    } catch (error) {
      throw new Error(
        `Error getting unique category names: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateCategory(
    id: number,
    data: Partial<Category>
  ): Promise<Category | null> {
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Category] !== undefined &&
        data[key as keyof Category] !== null &&
        data[key as keyof Category] !== ""
    );

    if (dataKeys.length === 0) return null;

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Category]);
    values.push(id);

    const query = `
            UPDATE category 
            SET ${setClause} 
            WHERE id = $${dataKeys.length + 1} 
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating category: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteCategory(id: number): Promise<void> {
    const query = `DELETE FROM category WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting category: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteCategoriesByProductId(productId: number): Promise<void> {
    const query = `DELETE FROM category WHERE product_id = $1`;
    const values = [productId];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting categories by product id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Search and Analytics ====================

  static async findCategoriesByName(name: string): Promise<Category[]> {
    const query = `SELECT * FROM category WHERE name ILIKE $1 ORDER BY name`;
    const values = [`%${name}%`];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding categories by name: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getCategoryStatistics(): Promise<{
    total_categories: number;
    unique_category_names: number;
    products_per_category: Array<{ name: string; product_count: number }>;
  }> {
    const totalQuery = `SELECT COUNT(*) as total_categories FROM category`;
    const uniqueQuery = `SELECT COUNT(DISTINCT name) as unique_category_names FROM category`;
    const productsPerCategoryQuery = `
            SELECT name, COUNT(product_id) as product_count 
            FROM category 
            GROUP BY name 
            ORDER BY product_count DESC
        `;

    try {
      const [totalResult, uniqueResult, productsResult] = await Promise.all([
        this.db.query(totalQuery),
        this.db.query(uniqueQuery),
        this.db.query(productsPerCategoryQuery),
      ]);

      return {
        total_categories: parseInt(totalResult.rows[0].total_categories) || 0,
        unique_category_names:
          parseInt(uniqueResult.rows[0].unique_category_names) || 0,
        products_per_category:
          productsResult.rows.map((row) => ({
            name: row.name,
            product_count: parseInt(row.product_count),
          })) || [],
      };
    } catch (error) {
      throw new Error(
        `Error getting category statistics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getPopularCategories(
    limit: number = 10
  ): Promise<Array<{ name: string; product_count: number }>> {
    const query = `
            SELECT name, COUNT(product_id) as product_count 
            FROM category 
            GROUP BY name 
            ORDER BY product_count DESC 
            LIMIT $1
        `;
    const values = [limit];

    try {
      const result = await this.db.query(query, values);
      return (
        result.rows.map((row) => ({
          name: row.name,
          product_count: parseInt(row.product_count),
        })) || []
      );
    } catch (error) {
      throw new Error(
        `Error getting popular categories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Bulk Operations ====================

  static async createMultipleCategories(
    categories: Partial<Category>[]
  ): Promise<Category[]> {
    if (categories.length === 0) return [];

    const valueStrings = categories
      .map((_, index) => {
        const offset = index * 2;
        return `($${offset + 1}, $${offset + 2})`;
      })
      .join(", ");

    const values = categories.flatMap((category) => [
      category.name,
      category.product_id,
    ]);

    const query = `
            INSERT INTO category (name, product_id)
            VALUES ${valueStrings}
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error creating multiple categories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
