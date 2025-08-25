import pg from "@/config/postgres";
import Review from "@/types/product/reviews.entity";

class ReviewModel {
    static async createReview(reviewData: Review): Promise<Review | null> {
        const { product_id, user_id, rating, comment } = reviewData;

        const query = `
            REPLACE INTO reviews (user_id, product_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const values = [user_id, product_id, rating, comment];

        try {
            const result = await pg.query(query, values);
            return result.rows[0] || null;
        } catch {
            throw new Error("Error creating review");
        }
    }

    static async deleteReview(reviewId: string, userId: string): Promise<Review | null> {
        const query = `
            DELETE FROM reviews
            WHERE id = $1 AND user_id = $2
            RETURNING *;
        `;

        const values = [reviewId, userId];

        try {
            const result = await pg.query(query, values);
            return result.rows[0] || null;
        } catch {
            throw new Error("Error deleting review");
        }
    }

    static async getReviews(product_id: string, start: number, limit: number): Promise<Review[] | null> {
        const query = `
            SELECT * FROM reviews
            WHERE product_id = $1
            LIMIT $2 OFFSET $3;
        `;

        const values = [product_id, limit, start];

        try {
            const result = await pg.query(query, values);
            return result.rows || null;
        } catch {
            throw new Error("Error fetching reviews");
        }
    }
}

export default ReviewModel;