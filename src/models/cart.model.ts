import pg from "../config/postgres";

interface CartWithVariant {
  cart_id: number;
  user_id: number;
  variant_id: number;
  quantity: number;
  added_at: Date;
  updated_at: Date;

  // Product and variant details
  product_id: number;
  product_name: string;
  product_description: string;
  variant_size: string | null;
  variant_color: string | null;
  variant_price: number;
  variant_stock: number;
  image_url: string | null;

  // Calculated fields
  item_total: number; // quantity * variant_price
  is_available: boolean; // variant_stock > 0
  is_valid: boolean; // quantity <= variant_stock
}

interface CartSummary {
  total_items: number;
  total_quantity: number;
  subtotal: number;
  total_unique_products: number;
  items: CartWithVariant[];
  has_unavailable_items: boolean;
  unavailable_items: CartWithVariant[];
}

export default class CartModel {
  static db = pg;

  // ==================== Core Cart Operations ====================

  /**
   * Add variant to cart (this is how users actually add items)
   * Users must select specific size/color before adding to cart
   */
  static async addVariantToCart(
    userId: number,
    variantId: number,
    quantity: number,
  ): Promise<CartWithVariant> {
    // First check if variant exists and is available
    const variantCheck = `
            SELECT pv.*, p.name as product_name, p.description 
            FROM product_variants pv 
            JOIN products p ON pv.product_id = p.id 
            WHERE pv.id = $1
        `;

    const variantResult = await this.db.query(variantCheck, [variantId]);
    if (variantResult.rows.length === 0) {
      throw new Error("Variant not found");
    }

    const variant = variantResult.rows[0];
    if (variant.stock < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${variant.stock}, Requested: ${quantity}`,
      );
    }

    // Check if item already exists in cart
    const existingQuery = `
            SELECT * FROM cart WHERE user_id = $1 AND variant_id = $2
        `;
    const existingResult = await this.db.query(existingQuery, [
      userId,
      variantId,
    ]);

    if (existingResult.rows.length > 0) {
      // Update existing cart item
      const newQuantity = existingResult.rows[0].quantity + quantity;
      if (newQuantity > variant.stock) {
        throw new Error(
          `Cannot add ${quantity} items. Cart would have ${newQuantity} items but only ${variant.stock} available.`,
        );
      }

      const updateQuery = `
                UPDATE cart 
                SET quantity = $1, updated_at = NOW() 
                WHERE user_id = $2 AND variant_id = $3 
                RETURNING *
            `;
      const updateResult = await this.db.query(updateQuery, [
        newQuantity,
        userId,
        variantId,
      ]);
      return this.getCartItemWithDetails(updateResult.rows[0]);
    } else {
      // Add new cart item
      const insertQuery = `
                INSERT INTO cart (user_id, variant_id, quantity) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `;
      const insertResult = await this.db.query(insertQuery, [
        userId,
        variantId,
        quantity,
      ]);
      return this.getCartItemWithDetails(insertResult.rows[0]);
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItemQuantity(
    userId: number,
    variantId: number,
    quantity: number,
  ): Promise<CartWithVariant | null> {
    if (quantity <= 0) {
      await this.removeVariantFromCart(userId, variantId);
      return null;
    }

    // Check variant stock
    const variantCheck = `SELECT stock FROM product_variants WHERE id = $1`;
    const variantResult = await this.db.query(variantCheck, [variantId]);
    if (variantResult.rows.length === 0) {
      throw new Error("Variant not found");
    }

    const availableStock = variantResult.rows[0].stock;
    if (quantity > availableStock) {
      throw new Error(
        `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
      );
    }

    const query = `
            UPDATE cart 
            SET quantity = $1, updated_at = NOW() 
            WHERE user_id = $2 AND variant_id = $3 
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, [quantity, userId, variantId]);
      if (result.rows.length === 0) return null;

      return this.getCartItemWithDetails(result.rows[0]);
    } catch (error) {
      throw new Error(
        `Error updating cart item: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Remove variant from cart
   */
  static async removeVariantFromCart(
    userId: number,
    variantId: number,
  ): Promise<void> {
    const query = `DELETE FROM cart WHERE user_id = $1 AND variant_id = $2`;

    try {
      await this.db.query(query, [userId, variantId]);
    } catch (error) {
      throw new Error(
        `Error removing variant from cart: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get user's cart with all variant details
   */
  static async getUserCart(userId: number): Promise<CartSummary> {
    const query = `
            SELECT 
                c.id as cart_id,
                c.user_id,
                c.variant_id,
                c.quantity,
                c.added_at,
                c.updated_at,
                
                -- Product details
                p.id as product_id,
                p.name as product_name,
                p.description as product_description,
                
                -- Variant details
                pv.size as variant_size,
                pv.color as variant_color,
                pv.price as variant_price,
                pv.stock as variant_stock,
                
                -- Image
                (SELECT image_url FROM image WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url,
                
                -- Calculated fields
                (c.quantity * pv.price) as item_total,
                (pv.stock > 0) as is_available,
                (c.quantity <= pv.stock) as is_valid
                
            FROM cart c
            JOIN product_variants pv ON c.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE c.user_id = $1
            ORDER BY c.added_at DESC
        `;

    try {
      const result = await this.db.query(query, [userId]);
      const items: CartWithVariant[] = result.rows.map((row) => ({
        cart_id: row.cart_id,
        user_id: row.user_id,
        variant_id: row.variant_id,
        quantity: row.quantity,
        added_at: row.added_at,
        updated_at: row.updated_at,
        product_id: row.product_id,
        product_name: row.product_name,
        product_description: row.product_description,
        variant_size: row.variant_size,
        variant_color: row.variant_color,
        variant_price: parseFloat(row.variant_price),
        variant_stock: row.variant_stock,
        image_url: row.image_url,
        item_total: parseFloat(row.item_total),
        is_available: row.is_available,
        is_valid: row.is_valid,
      }));

      const availableItems = items.filter(
        (item) => item.is_available && item.is_valid,
      );
      const unavailableItems = items.filter(
        (item) => !item.is_available || !item.is_valid,
      );

      return {
        total_items: items.length,
        total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: availableItems.reduce(
          (sum, item) => sum + item.item_total,
          0,
        ),
        total_unique_products: new Set(items.map((item) => item.product_id))
          .size,
        items,
        has_unavailable_items: unavailableItems.length > 0,
        unavailable_items: unavailableItems,
      };
    } catch (error) {
      throw new Error(
        `Error getting user cart: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Clear entire cart
   */
  static async clearUserCart(userId: number): Promise<void> {
    const query = `DELETE FROM cart WHERE user_id = $1`;

    try {
      await this.db.query(query, [userId]);
    } catch (error) {
      throw new Error(
        `Error clearing cart: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Remove unavailable items from cart (cleanup)
   */
  static async removeUnavailableItems(
    userId: number,
  ): Promise<CartWithVariant[]> {
    const query = `
            DELETE FROM cart c
            USING product_variants pv
            WHERE c.variant_id = pv.id 
            AND c.user_id = $1 
            AND (pv.stock = 0 OR c.quantity > pv.stock)
            RETURNING c.*
        `;

    try {
      const result = await this.db.query(query, [userId]);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error removing unavailable items: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ==================== Helper Methods ====================

  private static async getCartItemWithDetails(cartItem: {
    id: number;
  }): Promise<CartWithVariant> {
    const query = `
            SELECT 
                c.id as cart_id,
                c.user_id,
                c.variant_id,
                c.quantity,
                c.added_at,
                c.updated_at,
                
                p.id as product_id,
                p.name as product_name,
                p.description as product_description,
                
                pv.size as variant_size,
                pv.color as variant_color,
                pv.price as variant_price,
                pv.stock as variant_stock,
                
                (SELECT image_url FROM image WHERE product_id = p.id ORDER BY display_order LIMIT 1) as image_url,
                
                (c.quantity * pv.price) as item_total,
                (pv.stock > 0) as is_available,
                (c.quantity <= pv.stock) as is_valid
                
            FROM cart c
            JOIN product_variants pv ON c.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE c.id = $1
        `;

    const result = await this.db.query(query, [cartItem.id]);
    const row = result.rows[0];

    return {
      cart_id: row.cart_id,
      user_id: row.user_id,
      variant_id: row.variant_id,
      quantity: row.quantity,
      added_at: row.added_at,
      updated_at: row.updated_at,
      product_id: row.product_id,
      product_name: row.product_name,
      product_description: row.product_description,
      variant_size: row.variant_size,
      variant_color: row.variant_color,
      variant_price: parseFloat(row.variant_price),
      variant_stock: row.variant_stock,
      image_url: row.image_url,
      item_total: parseFloat(row.item_total),
      is_available: row.is_available,
      is_valid: row.is_valid,
    };
  }

  // ==================== Cart Validation ====================

  /**
   * Validate entire cart before checkout
   */
  static async validateCart(userId: number): Promise<{
    is_valid: boolean;
    errors: string[];
    updated_items: CartWithVariant[];
  }> {
    const cart = await this.getUserCart(userId);
    const errors: string[] = [];
    const updatedItems: CartWithVariant[] = [];

    for (const item of cart.items) {
      if (!item.is_available) {
        errors.push(
          `${item.product_name} (${item.variant_size}/${item.variant_color}) is out of stock`,
        );
      } else if (!item.is_valid) {
        // Try to update to maximum available quantity
        const maxQuantity = item.variant_stock;
        if (maxQuantity > 0) {
          const updated = await this.updateCartItemQuantity(
            userId,
            item.variant_id,
            maxQuantity,
          );
          if (updated) {
            updatedItems.push(updated);
            errors.push(
              `${item.product_name} quantity reduced to ${maxQuantity} (max available)`,
            );
          }
        } else {
          await this.removeVariantFromCart(userId, item.variant_id);
          errors.push(`${item.product_name} removed (out of stock)`);
        }
      }
    }

    return {
      is_valid: errors.length === 0,
      errors,
      updated_items: updatedItems,
    };
  }

  // ==================== Analytics ====================

  static async getCartStatistics(): Promise<{
    total_carts: number;
    total_items: number;
    average_items_per_cart: number;
    most_added_variants: Array<{
      variant_id: number;
      product_name: string;
      variant_size: string | null;
      variant_color: string | null;
      times_added: number;
    }>;
  }> {
    const totalCartsQuery = `SELECT COUNT(DISTINCT user_id) as total_carts FROM cart`;
    const totalItemsQuery = `SELECT COUNT(*) as total_items FROM cart`;
    const topVariantsQuery = `
            SELECT 
                c.variant_id,
                p.name as product_name,
                pv.size as variant_size,
                pv.color as variant_color,
                COUNT(*) as times_added
            FROM cart c
            JOIN product_variants pv ON c.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            GROUP BY c.variant_id, p.name, pv.size, pv.color
            ORDER BY times_added DESC
            LIMIT 10
        `;

    try {
      const [totalCartsResult, totalItemsResult, topVariantsResult] =
        await Promise.all([
          this.db.query(totalCartsQuery),
          this.db.query(totalItemsQuery),
          this.db.query(topVariantsQuery),
        ]);

      const totalCarts = parseInt(totalCartsResult.rows[0].total_carts) || 0;
      const totalItems = parseInt(totalItemsResult.rows[0].total_items) || 0;

      return {
        total_carts: totalCarts,
        total_items: totalItems,
        average_items_per_cart: totalCarts > 0 ? totalItems / totalCarts : 0,
        most_added_variants: topVariantsResult.rows.map((row) => ({
          variant_id: row.variant_id,
          product_name: row.product_name,
          variant_size: row.variant_size,
          variant_color: row.variant_color,
          times_added: parseInt(row.times_added),
        })),
      };
    } catch (error) {
      throw new Error(
        `Error getting cart statistics: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
