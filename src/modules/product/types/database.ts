// src/modules/product/types/database.ts
export interface ProductRow {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  base_price: string; // Decimal comes as string from DB
  category_id?: number;
  brand?: string;
  sku_prefix: string;
  weight?: string; // Decimal comes as string from DB
  dimensions?: string; // JSON comes as string from DB
  meta_title?: string;
  meta_description?: string;
  status: string;
  is_featured: boolean;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
  // Category fields (when joined)
  category_name?: string;
  category_slug?: string;
  // Aggregated fields
  variants?: VariantRow[];
  images?: ImageRow[];
}

export interface VariantRow {
  id: number;
  product_id: number;
  sku: string;
  color?: string;
  size?: string;
  material?: string;
  price?: number;
  cost_price?: number;
  stock: number;
  reserved_stock: number;
  min_stock_alert: number;
  weight?: number;
  barcode?: string;
  supplier_sku?: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface ImageRow {
  id: number;
  product_id: number;
  variant_id?: number;
  image_url: string;
  alt_text?: string;
  image_type: "product" | "gallery" | "thumbnail" | "zoom";
  sort_order: number;
  is_primary: boolean;
  file_size?: number;
  width?: number;
  height?: number;
  created_at: Date;
}
