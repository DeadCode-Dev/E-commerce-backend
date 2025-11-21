export default interface ProductWithVariants {
  product_id: number;
  product_name: string;
  description: string;
  variant_id: number;
  size: string;
  color: string;
  stock: number;
  variant_price: number;
  created_at: Date;
  updated_at: Date;
  category_id: number;
  category_name: string;
  image_id: number;
  image_url: string;
  alt_text?: string;
  display_order: number;
}
