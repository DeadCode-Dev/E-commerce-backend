import pg from "../config/postgres";
import Shipping from "../types/order/shipping.entity";

interface ShippingWithUserDetails extends Shipping {
  username: string;
  email: string;
  phone: string;
}

export default class ShippingModel {
  static db = pg;

  static async createShipping(data: Partial<Shipping>): Promise<Shipping> {
    const query = `
      INSERT INTO shipping (user_id, tracking_number, address, city, state, postal_code, country, shipping_status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const values = [
      data.user_id,
      data.tracking_number,
      data.address,
      data.city,
      data.state,
      data.postal_code,
      data.country,
      data.shipping_status || "pending",
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating shipping: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findShippingById(id: number): Promise<Shipping | null> {
    const query = `SELECT * FROM shipping WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding shipping by id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findShippingByUserId(userId: number): Promise<Shipping[]> {
    const query = `SELECT * FROM shipping WHERE user_id = $1 ORDER BY created_at DESC`;
    const values = [userId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding shipping by user id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findShippingByTrackingNumber(
    trackingNumber: string,
  ): Promise<Shipping | null> {
    const query = `SELECT * FROM shipping WHERE tracking_number = $1`;
    const values = [trackingNumber];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding shipping by tracking number: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getAllShipping(): Promise<Shipping[]> {
    const query = `SELECT * FROM shipping ORDER BY created_at DESC`;

    try {
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting all shipping: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async updateShipping(
    id: number,
    data: Partial<Shipping>,
  ): Promise<Shipping | null> {
    // Keep only fields with defined values
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Shipping] !== undefined &&
        data[key as keyof Shipping] !== null &&
        data[key as keyof Shipping] !== "",
    );

    if (dataKeys.length === 0) return null; // nothing to update

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Shipping]);
    values.push(id); // for WHERE clause

    const query = `
      UPDATE shipping 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $${dataKeys.length + 1} 
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating shipping: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async updateShippingStatus(
    id: number,
    status: string,
  ): Promise<Shipping | null> {
    const query = `
      UPDATE shipping 
      SET shipping_status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
    const values = [status, id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating shipping status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async updateTrackingNumber(
    id: number,
    trackingNumber: string,
  ): Promise<Shipping | null> {
    const query = `
      UPDATE shipping 
      SET tracking_number = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *
    `;
    const values = [trackingNumber, id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating tracking number: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async deleteShipping(id: number): Promise<void> {
    const query = `DELETE FROM shipping WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting shipping: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getShippingByStatus(status: string): Promise<Shipping[]> {
    const query = `SELECT * FROM shipping WHERE shipping_status = $1 ORDER BY created_at DESC`;
    const values = [status];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error getting shipping by status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getShippingWithUserDetails(
    id: number,
  ): Promise<ShippingWithUserDetails | null> {
    const query = `
      SELECT 
        s.*,
        u.username,
        u.email,
        u.phone
      FROM shipping s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error getting shipping with user details: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
