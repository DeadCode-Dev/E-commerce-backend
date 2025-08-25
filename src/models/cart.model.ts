import pg from "@/config/postgres";
import Cart from "@/types/cart/cart.entity";
import CartItem from "@/types/cart/cart.entity";

class CartModel {
    // Get cart by user id (each user has only one cart)
    static async getCartByUserId(userId: number): Promise<Cart & { items: CartItem[] } | null> {
        const cartQuery = `SELECT * FROM carts WHERE user_id = $1`;
        const cartResult = await pg.query(cartQuery, [userId]);
        if (!cartResult.rows[0]) return null;

        const cart = cartResult.rows[0];

        const itemsQuery = `SELECT * FROM cart_items WHERE cart_id = $1`;
        const itemsResult = await pg.query(itemsQuery, [cart.id]);

        return {
            ...cart,
            items: itemsResult.rows || []
        };
    }

    // Create a cart for a user (if not exists)
    static async createCart(userId: number): Promise<Cart | null> {
        const query = `INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING *`;
        const result = await pg.query(query, [userId]);
        return result.rows[0] || null;
    }

    // Add item to cart
    static async addItemToCart(cartId: number, productId: number, quantity: number): Promise<CartItem | null> {
        const query = `
            INSERT INTO cart_items (cart_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (cart_id, product_id)
            DO UPDATE SET quantity = cart_items.quantity + $3
            RETURNING *`;
        const result = await pg.query(query, [cartId, productId, quantity]);
        return result.rows[0] || null;
    }

    // Remove item from cart
    static async removeItemFromCart(cartId: number, productId: number): Promise<void> {
        const query = `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`;
        await pg.query(query, [cartId, productId]);
    }

    // Update item quantity
    static async updateItemQuantity(cartId: number, productId: number, quantity: number): Promise<CartItem | null> {
        const query = `
            UPDATE cart_items SET quantity = $3
            WHERE cart_id = $1 AND product_id = $2
            RETURNING *`;
        const result = await pg.query(query, [cartId, productId, quantity]);
        return result.rows[0] || null;
    }

    // Delete cart (and cascade items)
    static async deleteCart(cartId: number): Promise<void> {
        const query = `DELETE FROM carts WHERE id = $1`;
        await pg.query(query, [cartId]);
    }
}

export default CartModel;