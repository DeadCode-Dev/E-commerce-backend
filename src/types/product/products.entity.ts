// Base Product interface
export default interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  base_price: number;
  category_id?: number;
  brand?: string;
  sku_prefix: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    length: number;
    unit: string;
  };
  meta_title?: string;
  meta_description?: string;
  status: "active" | "inactive" | "draft" | "archived";
  is_featured: boolean;
  tags?: string[];
  created_at: Date;
  updated_at: Date;

  // Relations (populated when needed)
  variants?: ProductVariant[];
  images?: ProductImage[];
  category?: Category;
}

// Product Variant interface
export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  color?: string;
  size?: string;
  material?: string;
  price?: number; // If null, uses base_price from product
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

  // Relations
  images?: ProductImage[];
  product?: Product;
}

// Product Image interface
export interface ProductImage {
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

// Category interface
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;

  // Relations
  children?: Category[];
  parent?: Category;
  products?: Product[];
}

// Extended Product interface with computed fields
export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  available_colors: string[];
  available_sizes: string[];
  available_materials: string[];
  price_range: {
    min: number;
    max: number;
  };
  total_stock: number;
  available_stock: number; // total_stock - reserved_stock
  is_in_stock: boolean;
  low_stock_variants: ProductVariant[];
}

// For API requests
export interface CreateProductRequest {
  name: string;
  slug?: string;
  description: string;
  short_description?: string;
  base_price: number;
  category_id?: number;
  brand?: string;
  sku_prefix: string;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    length: number;
    unit: string;
  };
  meta_title?: string;
  meta_description?: string;
  status?: "active" | "inactive" | "draft";
  is_featured?: boolean;
  tags?: string[];
  variants: CreateVariantRequest[];
  images?: CreateImageRequest[];
}

export interface CreateVariantRequest {
  sku?: string;
  color?: string;
  size?: string;
  material?: string;
  price?: number;
  cost_price?: number;
  stock: number;
  weight?: number;
  barcode?: string;
  supplier_sku?: string;
  is_default?: boolean;
  sort_order?: number;
}

export interface CreateImageRequest {
  variant_id?: number;
  image_url: string;
  alt_text?: string;
  image_type?: "product" | "gallery" | "thumbnail" | "zoom";
  sort_order?: number;
  is_primary?: boolean;
}

// For stock management
export interface StockOperation {
  variant_id: number;
  quantity: number;
  operation: "reserve" | "release" | "fulfill" | "adjust";
  reason?: string;
}

// For API responses
export interface ProductListResponse {
  products: ProductWithVariants[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: {
    categories: Array<{ id: number; name: string; slug: string }>;
    brands: string[];
    price_range: { min: number; max: number };
    colors: string[];
    sizes: string[];
    materials: string[];
  };
}
