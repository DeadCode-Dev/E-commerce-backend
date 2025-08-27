import { EntityId, ProductStatus } from "../../shared/types/api.types";
import { Money } from "../value-objects/money.vo";

export interface ProductVariantProps {
  id: EntityId;
  productId: EntityId;
  sku: string;
  size?: string;
  color?: string;
  material?: string;
  price: Money;
  compareAtPrice?: Money;
  stockQuantity: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductProps {
  id: EntityId;
  name: string;
  description: string;
  slug: string;
  categoryId: EntityId;
  vendorId?: EntityId;
  basePrice: Money;
  status: ProductStatus;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  variants: ProductVariant[];
  averageRating: number;
  reviewCount: number;
  totalSales: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductVariant {
  private constructor(private readonly props: ProductVariantProps) {}

  static create(
    props: Omit<ProductVariantProps, "id" | "createdAt" | "updatedAt">
  ): ProductVariant {
    const now = new Date();
    return new ProductVariant({
      ...props,
      id: 0, // Will be set by repository
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ProductVariantProps): ProductVariant {
    return new ProductVariant(props);
  }

  // Getters
  get id(): EntityId {
    return this.props.id;
  }

  get productId(): EntityId {
    return this.props.productId;
  }

  get sku(): string {
    return this.props.sku;
  }

  get size(): string | undefined {
    return this.props.size;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get material(): string | undefined {
    return this.props.material;
  }

  get price(): Money {
    return this.props.price;
  }

  get compareAtPrice(): Money | undefined {
    return this.props.compareAtPrice;
  }

  get stockQuantity(): number {
    return this.props.stockQuantity;
  }

  get weight(): number | undefined {
    return this.props.weight;
  }

  get dimensions():
    | { length: number; width: number; height: number }
    | undefined {
    return this.props.dimensions;
  }

  get images(): string[] {
    return [...this.props.images];
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updatePrice(newPrice: Money): void {
    this.props.price = newPrice;
    this.props.updatedAt = new Date();
  }

  updateStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error("Stock quantity cannot be negative");
    }
    this.props.stockQuantity = quantity;
    this.props.updatedAt = new Date();
  }

  decreaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }
    if (this.props.stockQuantity < quantity) {
      throw new Error("Insufficient stock");
    }
    this.props.stockQuantity -= quantity;
    this.props.updatedAt = new Date();
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }
    this.props.stockQuantity += quantity;
    this.props.updatedAt = new Date();
  }

  addImage(imageUrl: string): void {
    if (!this.props.images.includes(imageUrl)) {
      this.props.images.push(imageUrl);
      this.props.updatedAt = new Date();
    }
  }

  removeImage(imageUrl: string): void {
    const index = this.props.images.indexOf(imageUrl);
    if (index > -1) {
      this.props.images.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  isInStock(): boolean {
    return this.props.stockQuantity > 0 && this.props.isActive;
  }

  hasDiscount(): boolean {
    return this.props.compareAtPrice?.isGreaterThan(this.props.price) ?? false;
  }

  getDiscountPercentage(): number {
    if (!this.hasDiscount() || !this.props.compareAtPrice) {
      return 0;
    }
    const discount = this.props.compareAtPrice.subtract(this.props.price);
    return Math.round(
      (discount.getAmount() / this.props.compareAtPrice.getAmount()) * 100
    );
  }

  getDisplayName(): string {
    const parts = [
      this.props.size,
      this.props.color,
      this.props.material,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : "Default";
  }

  toPersistence(): ProductVariantProps {
    return { ...this.props };
  }
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  static create(
    props: Omit<
      ProductProps,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "averageRating"
      | "reviewCount"
      | "totalSales"
    >
  ): Product {
    const now = new Date();
    return new Product({
      ...props,
      id: 0, // Will be set by repository
      averageRating: 0,
      reviewCount: 0,
      totalSales: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  // Getters
  get id(): EntityId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get slug(): string {
    return this.props.slug;
  }

  get categoryId(): EntityId {
    return this.props.categoryId;
  }

  get vendorId(): EntityId | undefined {
    return this.props.vendorId;
  }

  get basePrice(): Money {
    return this.props.basePrice;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get metaTitle(): string | undefined {
    return this.props.metaTitle;
  }

  get metaDescription(): string | undefined {
    return this.props.metaDescription;
  }

  get variants(): ProductVariant[] {
    return [...this.props.variants];
  }

  get averageRating(): number {
    return this.props.averageRating;
  }

  get reviewCount(): number {
    return this.props.reviewCount;
  }

  get totalSales(): number {
    return this.props.totalSales;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  updateDetails(name: string, description: string): void {
    this.props.name = name;
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateStatus(status: ProductStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  addTag(tag: string): void {
    const normalizedTag = tag.toLowerCase().trim();
    if (!this.props.tags.includes(normalizedTag)) {
      this.props.tags.push(normalizedTag);
      this.props.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const normalizedTag = tag.toLowerCase().trim();
    const index = this.props.tags.indexOf(normalizedTag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  addVariant(variant: ProductVariant): void {
    // Check if variant with same attributes already exists
    const existingVariant = this.props.variants.find(
      (v) =>
        v.sku === variant.sku ||
        (v.size === variant.size &&
          v.color === variant.color &&
          v.material === variant.material)
    );

    if (existingVariant) {
      throw new Error("Variant with these attributes already exists");
    }

    this.props.variants.push(variant);
    this.props.updatedAt = new Date();
  }

  removeVariant(variantId: EntityId): void {
    const index = this.props.variants.findIndex((v) => v.id === variantId);
    if (index > -1) {
      this.props.variants.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  updateRating(newRating: number, newReviewCount: number): void {
    this.props.averageRating = newRating;
    this.props.reviewCount = newReviewCount;
    this.props.updatedAt = new Date();
  }

  incrementSales(quantity = 1): void {
    this.props.totalSales += quantity;
    this.props.updatedAt = new Date();
  }

  setFeatured(featured: boolean): void {
    this.props.isFeatured = featured;
    this.props.updatedAt = new Date();
  }

  updateSEO(metaTitle?: string, metaDescription?: string): void {
    this.props.metaTitle = metaTitle;
    this.props.metaDescription = metaDescription;
    this.props.updatedAt = new Date();
  }

  // Query methods
  isActive(): boolean {
    return this.props.status === "active";
  }

  isInStock(): boolean {
    return this.props.variants.some((variant) => variant.isInStock());
  }

  getActiveVariants(): ProductVariant[] {
    return this.props.variants.filter((variant) => variant.isActive);
  }

  getInStockVariants(): ProductVariant[] {
    return this.props.variants.filter((variant) => variant.isInStock());
  }

  getVariantById(variantId: EntityId): ProductVariant | undefined {
    return this.props.variants.find((variant) => variant.id === variantId);
  }

  getVariantBySku(sku: string): ProductVariant | undefined {
    return this.props.variants.find((variant) => variant.sku === sku);
  }

  getLowestPrice(): Money {
    const activeVariants = this.getActiveVariants();
    if (activeVariants.length === 0) {
      return this.props.basePrice;
    }

    return activeVariants.reduce(
      (lowest, variant) =>
        variant.price.isLessThan(lowest) ? variant.price : lowest,
      activeVariants[0].price
    );
  }

  getHighestPrice(): Money {
    const activeVariants = this.getActiveVariants();
    if (activeVariants.length === 0) {
      return this.props.basePrice;
    }

    return activeVariants.reduce(
      (highest, variant) =>
        variant.price.isGreaterThan(highest) ? variant.price : highest,
      activeVariants[0].price
    );
  }

  getTotalStock(): number {
    return this.props.variants.reduce(
      (total, variant) => total + variant.stockQuantity,
      0
    );
  }

  hasTag(tag: string): boolean {
    return this.props.tags.includes(tag.toLowerCase().trim());
  }

  matchesSearch(searchTerm: string): boolean {
    const term = searchTerm.toLowerCase();
    return (
      this.props.name.toLowerCase().includes(term) ||
      this.props.description.toLowerCase().includes(term) ||
      this.props.tags.some((tag) => tag.includes(term))
    );
  }

  toPersistence(): ProductProps {
    return { ...this.props };
  }

  toPublic(): Omit<ProductProps, "vendorId"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { vendorId, ...publicProps } = this.props;
    return publicProps;
  }
}
