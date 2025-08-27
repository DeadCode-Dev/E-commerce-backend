import { Product, ProductVariant } from "../entities/product.entity";
import {
  EntityId,
  SearchParams,
  ProductStatus,
} from "../../shared/types/api.types";
import { Money } from "../value-objects/money.vo";

export interface ProductSearchFilters {
  categoryId?: EntityId;
  vendorId?: EntityId;
  status?: ProductStatus;
  minPrice?: Money;
  maxPrice?: Money;
  tags?: string[];
  inStock?: boolean;
  featured?: boolean;
  minRating?: number;
}

export interface ProductRepository {
  // Basic CRUD operations
  create(product: Product): Promise<Product>;
  findById(id: EntityId): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  update(product: Product): Promise<Product>;
  delete(id: EntityId): Promise<void>;

  // Query methods
  findMany(params: SearchParams & { filters?: ProductSearchFilters }): Promise<{
    products: Product[];
    total: number;
  }>;

  search(query: string, filters?: ProductSearchFilters): Promise<Product[]>;
  findFeatured(limit?: number): Promise<Product[]>;
  findByCategory(
    categoryId: EntityId,
    params?: SearchParams
  ): Promise<{
    products: Product[];
    total: number;
  }>;
  findByVendor(
    vendorId: EntityId,
    params?: SearchParams
  ): Promise<{
    products: Product[];
    total: number;
  }>;
  findRelated(productId: EntityId, limit?: number): Promise<Product[]>;
  findPopular(limit?: number): Promise<Product[]>;
  findRecentlyAdded(limit?: number): Promise<Product[]>;

  // Business queries
  existsBySlug(slug: string): Promise<boolean>;
  countByCategory(categoryId: EntityId): Promise<number>;
  countByVendor(vendorId: EntityId): Promise<number>;
  getTotalInventoryValue(): Promise<Money>;

  // Bulk operations
  createMany(products: Product[]): Promise<Product[]>;
  updateMany(products: Product[]): Promise<Product[]>;
  deleteMany(ids: EntityId[]): Promise<void>;
  updateStatusMany(ids: EntityId[], status: ProductStatus): Promise<void>;
}

export interface ProductVariantRepository {
  // Basic CRUD operations
  create(variant: ProductVariant): Promise<ProductVariant>;
  findById(id: EntityId): Promise<ProductVariant | null>;
  findBySku(sku: string): Promise<ProductVariant | null>;
  update(variant: ProductVariant): Promise<ProductVariant>;
  delete(id: EntityId): Promise<void>;

  // Query methods
  findByProductId(productId: EntityId): Promise<ProductVariant[]>;
  findMany(params: SearchParams): Promise<{
    variants: ProductVariant[];
    total: number;
  }>;
  findInStock(): Promise<ProductVariant[]>;
  findLowStock(threshold: number): Promise<ProductVariant[]>;

  // Business queries
  existsBySku(sku: string): Promise<boolean>;
  getTotalStock(): Promise<number>;
  getStockValue(): Promise<Money>;

  // Bulk operations
  createMany(variants: ProductVariant[]): Promise<ProductVariant[]>;
  updateMany(variants: ProductVariant[]): Promise<ProductVariant[]>;
  deleteMany(ids: EntityId[]): Promise<void>;
  updateStockMany(
    updates: Array<{ id: EntityId; quantity: number }>
  ): Promise<void>;
}
