import pg from "../config/postgres";
import Image from "../types/product/image.entity";

export default class ImageModel {
  static db = pg;

  // ==================== Basic CRUD Operations ====================

  static async createImage(data: {
    product_id: number;
    image_url: string;
    alt_text?: string;
    display_order?: number;
  }): Promise<Image> {
    const query = `
            INSERT INTO image (product_id, image_url, alt_text, display_order) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
    const values = [
      data.product_id,
      data.image_url,
      data.alt_text || null,
      data.display_order || 0,
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findImageById(id: number): Promise<Image | null> {
    const query = `SELECT * FROM image WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding image by id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findImagesByProductId(productId: number): Promise<Image[]> {
    const query = `SELECT * FROM image WHERE product_id = $1 ORDER BY display_order ASC, id ASC`;
    const values = [productId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding images by product id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getAllImages(): Promise<Image[]> {
    const query = `SELECT * FROM image ORDER BY product_id, display_order ASC, id ASC`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting all images: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateImage(
    id: number,
    data: Partial<Image>
  ): Promise<Image | null> {
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Image] !== undefined &&
        data[key as keyof Image] !== null &&
        data[key as keyof Image] !== ""
    );

    if (dataKeys.length === 0) return null;

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Image]);
    values.push(id);

    const query = `
            UPDATE image 
            SET ${setClause} 
            WHERE id = $${dataKeys.length + 1} 
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteImage(id: number): Promise<void> {
    const query = `DELETE FROM image WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteImagesByProductId(productId: number): Promise<void> {
    const query = `DELETE FROM image WHERE product_id = $1`;
    const values = [productId];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting images by product id: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Specialized Image Operations ====================

  static async getPrimaryImageByProductId(
    productId: number
  ): Promise<Image | null> {
    const query = `
            SELECT * FROM image 
            WHERE product_id = $1 
            ORDER BY display_order ASC, id ASC 
            LIMIT 1
        `;
    const values = [productId];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error getting primary image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async reorderImages(
    productId: number,
    imageOrders: Array<{ id: number; display_order: number }>
  ): Promise<Image[]> {
    if (imageOrders.length === 0) return [];

    const updatePromises = imageOrders.map((item) => {
      const query = `UPDATE image SET display_order = $1 WHERE id = $2 AND product_id = $3 RETURNING *`;
      return this.db.query(query, [item.display_order, item.id, productId]);
    });

    try {
      const results = await Promise.all(updatePromises);
      return results.map((result) => result.rows[0]).filter(Boolean);
    } catch (error) {
      throw new Error(
        `Error reordering images: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getImageCount(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM image`;

    try {
      const result = await this.db.query(query);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      throw new Error(
        `Error getting image count: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getImageCountByProduct(): Promise<
    Array<{ product_id: number; image_count: number }>
  > {
    const query = `
            SELECT product_id, COUNT(*) as image_count 
            FROM image 
            GROUP BY product_id 
            ORDER BY image_count DESC
        `;

    try {
      const result = await this.db.query(query);
      return (
        result.rows.map((row) => ({
          product_id: row.product_id,
          image_count: parseInt(row.image_count),
        })) || []
      );
    } catch (error) {
      throw new Error(
        `Error getting image count by product: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async findImagesByUrl(url: string): Promise<Image[]> {
    const query = `SELECT * FROM image WHERE image_url ILIKE $1`;
    const values = [`%${url}%`];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding images by URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getImagesWithoutAltText(): Promise<Image[]> {
    const query = `SELECT * FROM image WHERE alt_text IS NULL OR alt_text = '' ORDER BY product_id, display_order`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting images without alt text: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==================== Bulk Operations ====================

  static async createMultipleImages(
    images: Array<{
      product_id: number;
      image_url: string;
      alt_text?: string;
      display_order?: number;
    }>
  ): Promise<Image[]> {
    if (images.length === 0) return [];

    const valueStrings = images
      .map((_, index) => {
        const offset = index * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      })
      .join(", ");

    const values = images.flatMap((image) => [
      image.product_id,
      image.image_url,
      image.alt_text || null,
      image.display_order || 0,
    ]);

    const query = `
            INSERT INTO image (product_id, image_url, alt_text, display_order)
            VALUES ${valueStrings}
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error creating multiple images: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateMultipleImages(
    images: Array<{ id: number } & Partial<Image>>
  ): Promise<Image[]> {
    if (images.length === 0) return [];

    const updatePromises = images.map((image) => {
      const { id, ...updateData } = image;
      return this.updateImage(id, updateData);
    });

    try {
      const results = await Promise.all(updatePromises);
      return results.filter(Boolean) as Image[];
    } catch (error) {
      throw new Error(
        `Error updating multiple images: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getImageStatistics(): Promise<{
    total_images: number;
    products_with_images: number;
    images_without_alt_text: number;
    average_images_per_product: number;
  }> {
    const totalQuery = `SELECT COUNT(*) as total_images FROM image`;
    const productsWithImagesQuery = `SELECT COUNT(DISTINCT product_id) as products_with_images FROM image`;
    const withoutAltTextQuery = `SELECT COUNT(*) as without_alt_text FROM image WHERE alt_text IS NULL OR alt_text = ''`;

    try {
      const [totalResult, productsResult, altTextResult] = await Promise.all([
        this.db.query(totalQuery),
        this.db.query(productsWithImagesQuery),
        this.db.query(withoutAltTextQuery),
      ]);

      const totalImages = parseInt(totalResult.rows[0].total_images) || 0;
      const productsWithImages =
        parseInt(productsResult.rows[0].products_with_images) || 0;
      const imagesWithoutAltText =
        parseInt(altTextResult.rows[0].without_alt_text) || 0;
      const averageImagesPerProduct =
        productsWithImages > 0 ? totalImages / productsWithImages : 0;

      return {
        total_images: totalImages,
        products_with_images: productsWithImages,
        images_without_alt_text: imagesWithoutAltText,
        average_images_per_product:
          Math.round(averageImagesPerProduct * 100) / 100,
      };
    } catch (error) {
      throw new Error(
        `Error getting image statistics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
