export default interface ProductWithVariants {
  p_id: number;
  p_name: string;
  p_description: string;
  v_id: number;
  v_size: string;
  v_color: string;
  v_stock: number;
  v_price: number;
  v_created_at: Date;
  v_updated_at: Date;
  category_name: string;
  image_url: string;
  alt_text?: string;
  image_display_order: number;
}
