import pg from "../config/postgres";
import Review from "../types/product/reviews.entity";

export interface ReviewWithUser extends Review {
  username: string;
  user_email?: string;
  product_name?: string;
}

export interface ReviewSearchOptions {
  productId?: number;
  userId?: number;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  sortBy?: "rating" | "created_at" | "updated_at";
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

export interface ProductReviewSummary {
  product_id: number;
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export default class ReviewModel {
  static db = pg;

  // ==================== Basic CRUD Operations ====================

  static async createReview(data: Partial<Review>): Promise<Review> {
    const query = `
            INSERT INTO reviews (user_id, product_id, rating, comment) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
    const values = [data.user_id, data.product_id, data.rating, data.comment];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating review: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findReviewById(id: number): Promise<Review | null> {
    const query = `SELECT * FROM reviews WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding review by id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findReviewsByProductId(
    productId: number,
  ): Promise<ReviewWithUser[]> {
    const query = `
            SELECT r.*, u.username, u.email as user_email
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.created_at DESC
        `;
    const values = [productId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding reviews by product id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findReviewsByUserId(userId: number): Promise<ReviewWithUser[]> {
    const query = `
            SELECT r.*, p.name as product_name
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
        `;
    const values = [userId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding reviews by user id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async updateReview(
    id: number,
    data: Partial<Review>,
  ): Promise<Review | null> {
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Review] !== undefined &&
        data[key as keyof Review] !== null &&
        data[key as keyof Review] !== "",
    );

    if (dataKeys.length === 0) return null;

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Review]);
    values.push(id);

    const query = `
            UPDATE reviews 
            SET ${setClause}, updated_at = NOW() 
            WHERE id = $${dataKeys.length + 1} 
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating review: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async deleteReview(id: number): Promise<void> {
    const query = `DELETE FROM reviews WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting review: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async searchReviews(
    options: ReviewSearchOptions,
  ): Promise<ReviewWithUser[]> {
    let baseQuery = `
            SELECT r.*, u.username, p.name as product_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN products p ON r.product_id = p.id
            WHERE 1=1
        `;

    const values: (string | number)[] = [];
    let paramCounter = 1;

    if (options.productId) {
      baseQuery += ` AND r.product_id = $${paramCounter}`;
      values.push(options.productId);
      paramCounter++;
    }

    if (options.userId) {
      baseQuery += ` AND r.user_id = $${paramCounter}`;
      values.push(options.userId);
      paramCounter++;
    }

    if (options.rating) {
      baseQuery += ` AND r.rating = $${paramCounter}`;
      values.push(options.rating);
      paramCounter++;
    }

    if (options.minRating !== undefined) {
      baseQuery += ` AND r.rating >= $${paramCounter}`;
      values.push(options.minRating);
      paramCounter++;
    }

    if (options.maxRating !== undefined) {
      baseQuery += ` AND r.rating <= $${paramCounter}`;
      values.push(options.maxRating);
      paramCounter++;
    }

    const sortBy = options.sortBy || "created_at";
    const sortOrder = options.sortOrder || "DESC";
    baseQuery += ` ORDER BY r.${sortBy} ${sortOrder}`;

    if (options.limit) {
      baseQuery += ` LIMIT $${paramCounter}`;
      values.push(options.limit);
      paramCounter++;

      if (options.offset) {
        baseQuery += ` OFFSET $${paramCounter}`;
        values.push(options.offset);
      }
    }

    try {
      const result = await this.db.query(baseQuery, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error searching reviews: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getProductReviewSummary(
    productId: number,
  ): Promise<ProductReviewSummary> {
    const query = `
            SELECT 
                product_id,
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                COUNT(*) FILTER (WHERE rating = 1) as rating_1,
                COUNT(*) FILTER (WHERE rating = 2) as rating_2,
                COUNT(*) FILTER (WHERE rating = 3) as rating_3,
                COUNT(*) FILTER (WHERE rating = 4) as rating_4,
                COUNT(*) FILTER (WHERE rating = 5) as rating_5
            FROM reviews 
            WHERE product_id = $1
            GROUP BY product_id
        `;
    const values = [productId];

    try {
      const result = await this.db.query(query, values);
      const row = result.rows[0];

      if (!row) {
        return {
          product_id: productId,
          total_reviews: 0,
          average_rating: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      return {
        product_id: row.product_id,
        total_reviews: parseInt(row.total_reviews),
        average_rating: parseFloat(row.average_rating),
        rating_distribution: {
          1: parseInt(row.rating_1),
          2: parseInt(row.rating_2),
          3: parseInt(row.rating_3),
          4: parseInt(row.rating_4),
          5: parseInt(row.rating_5),
        },
      };
    } catch (error) {
      throw new Error(
        `Error getting product review summary: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async hasUserReviewedProduct(
    userId: number,
    productId: number,
  ): Promise<boolean> {
    const query = `SELECT 1 FROM reviews WHERE user_id = $1 AND product_id = $2`;
    const values = [userId, productId];

    try {
      const result = await this.db.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(
        `Error checking if user reviewed product: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getRecentReviews(limit: number = 10): Promise<ReviewWithUser[]> {
    const query = `
            SELECT r.*, u.username, p.name as product_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN products p ON r.product_id = p.id
            ORDER BY r.created_at DESC
            LIMIT $1
        `;
    const values = [limit];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting recent reviews: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
