export default interface ProductVariant {
    id: number;
    product_id: number;
    size: string | null;
    color: string | null;
    hex: string | null;
    stock: number;
    price: number | null;
    created_at: Date;
    updated_at: Date;
}