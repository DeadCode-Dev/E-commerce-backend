import pg from "@/config/postgres";
import ProductVariant from "@/types/product/variant.entity";

class ProductVariantModel {
    static async updateProductVariants(id: number, data: Partial<ProductVariant>): Promise<ProductVariant | null> {
        // Keep only fields with defined values
        const dataKeys = Object.keys(data).filter(
            (key) =>
                data[key as keyof ProductVariant] !== undefined &&
                data[key as keyof ProductVariant] !== null &&
                data[key as keyof ProductVariant] !== ""
        );

        if (dataKeys.length === 0) return null; // nothing to update

        const setClause = dataKeys
            .map((key, index) => `${key} = $${index + 1}`)
            .join(", ");

        const values = dataKeys.map((key) => data[key as keyof ProductVariant]);
        values.push(id); // for WHERE clause

        const query = `UPDATE product_variants SET ${setClause} WHERE id = $${values.length} RETURNING *`;

        try {
            const result = await pg.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error updating product variant: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default ProductVariantModel;