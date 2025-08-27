import pg from "@/config/postgres";
import Product from "@/types/product/products.entity";
import ProductVariant from "@/types/product/variant.entity";

class ProductModel {
    static async getAllProducts(): Promise<Product[] | null> {
        const query = "SELECT * FROM products";
        const result = await pg.query(query);
        return result.rows || null;
    }

    static async getProductById(id: number): Promise<Product[] & ProductVariant [] | null> {
        const query = `SELECT * FROM ProductWithVariants WHERE id = $1;`;
        const result = await pg.query(query, [id]);
        if (!result.rows) return null;

        return result.rows || null;
    }

    static async getProductByName(name: string): Promise<Product[] & ProductVariant [] | null> {
        const query = `SELECT * FROM ProductWithVariants WHERE name = $1;`;
        const result = await pg.query(query, [name]);
        if (!result.rows) return null;

        return result.rows || null;
    }

    static async createProduct(data: Partial<Product>): Promise<Product | null> {

        const {name, description, category, images} = data;

        const query = `INSERT INTO products (name, description, category, images) VALUES ($1, $2, $3, $4) RETURNING *`;

        try {
            const result = await pg.query(query, [name, description, category, images]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error creating product: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    static async deleteProduct(id: number): Promise<void> {
        const query = `DELETE FROM products WHERE id = $1 CASCADE`;
        await pg.query(query, [id]);
    }

    static async updateProduct(id: number, data: Partial<Product>): Promise<Product | null> {
        // Keep only fields with defined values
        const dataKeys = Object.keys(data).filter(
            (key) =>
                data[key as keyof Product] !== undefined &&
                data[key as keyof Product] !== null &&
                data[key as keyof Product] !== ""
        );

        if (dataKeys.length === 0) return null; // nothing to update

        const setClause = dataKeys
            .map((key, index) => `${key} = $${index + 1}`)
            .join(", ");

        const values = dataKeys.map((key) => data[key as keyof Product]);
        values.push(id); // for WHERE clause

        const query = `UPDATE products SET ${setClause} WHERE id = $${values.length} RETURNING *`;

        try {
            const result = await pg.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error updating product: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default ProductModel;