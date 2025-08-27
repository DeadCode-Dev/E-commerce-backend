import {
  Product,
  ProductVariant,
} from "../../../domain/entities/product.entity";
import {
  ProductRepository,
  ProductVariantRepository,
} from "../../../domain/repositories/product.repository";
import { Money } from "../../../domain/value-objects/money.vo";
import { ValidationException } from "../../../shared/exceptions";
import { ProductStatus } from "../../../shared/types/api.types";

export interface CreateProductDto {
  name: string;
  description: string;
  categoryId: number;
  vendorId?: number;
  basePrice: {
    amount: number;
    currency: string;
  };
  status?: ProductStatus;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  isFeatured?: boolean;
  variants?: Array<{
    sku: string;
    size?: string;
    color?: string;
    material?: string;
    price: {
      amount: number;
      currency: string;
    };
    compareAtPrice?: {
      amount: number;
      currency: string;
    };
    stockQuantity: number;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }>;
}

export interface CreateProductResult {
  product: Product;
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: ProductVariantRepository
  ) {}

  async execute(dto: CreateProductDto): Promise<CreateProductResult> {
    // Validate input
    this.validateInput(dto);

    // Create value objects
    const basePrice = Money.create(
      dto.basePrice.amount,
      dto.basePrice.currency
    );

    // Generate slug from name
    const slug = this.generateSlug(dto.name);

    // Check if slug already exists
    const existingProduct = await this.productRepository.findBySlug(slug);
    if (existingProduct) {
      throw new ValidationException(
        "Product with similar name already exists",
        [
          {
            field: "name",
            message: "Product with similar name already exists",
            code: "DUPLICATE_NAME",
          },
        ]
      );
    }

    // Create product entity
    const product = Product.create({
      name: dto.name,
      description: dto.description,
      slug,
      categoryId: dto.categoryId,
      vendorId: dto.vendorId,
      basePrice,
      status: dto.status || ProductStatus.ACTIVE,
      tags: dto.tags || [],
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      variants: [],
      isFeatured: dto.isFeatured || false,
    });

    // Save product
    const savedProduct = await this.productRepository.create(product);

    // Create variants if provided
    if (dto.variants && dto.variants.length > 0) {
      for (const variantDto of dto.variants) {
        // Check if SKU already exists
        const existingVariant = await this.variantRepository.findBySku(
          variantDto.sku
        );
        if (existingVariant) {
          throw new ValidationException(
            `SKU ${variantDto.sku} already exists`,
            [
              {
                field: "sku",
                message: `SKU ${variantDto.sku} already exists`,
                code: "DUPLICATE_SKU",
              },
            ]
          );
        }

        const variantPrice = Money.create(
          variantDto.price.amount,
          variantDto.price.currency
        );
        const compareAtPrice = variantDto.compareAtPrice
          ? Money.create(
              variantDto.compareAtPrice.amount,
              variantDto.compareAtPrice.currency
            )
          : undefined;

        const variant = ProductVariant.create({
          productId: savedProduct.id,
          sku: variantDto.sku,
          size: variantDto.size,
          color: variantDto.color,
          material: variantDto.material,
          price: variantPrice,
          compareAtPrice,
          stockQuantity: variantDto.stockQuantity,
          weight: variantDto.weight,
          dimensions: variantDto.dimensions,
          images: [],
          isActive: true,
        });

        const savedVariant = await this.variantRepository.create(variant);
        savedProduct.addVariant(savedVariant);
      }

      // Update product with variants
      await this.productRepository.update(savedProduct);
    }

    return { product: savedProduct };
  }

  private validateInput(dto: CreateProductDto): void {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!dto.name?.trim()) {
      errors.push({
        field: "name",
        message: "Product name is required",
        code: "REQUIRED",
      });
    } else if (dto.name.length > 255) {
      errors.push({
        field: "name",
        message: "Product name is too long",
        code: "TOO_LONG",
      });
    }

    if (!dto.description?.trim()) {
      errors.push({
        field: "description",
        message: "Product description is required",
        code: "REQUIRED",
      });
    } else if (dto.description.length > 2000) {
      errors.push({
        field: "description",
        message: "Product description is too long",
        code: "TOO_LONG",
      });
    }

    if (!dto.categoryId || dto.categoryId <= 0) {
      errors.push({
        field: "categoryId",
        message: "Valid category ID is required",
        code: "REQUIRED",
      });
    }

    if (!dto.basePrice || dto.basePrice.amount < 0) {
      errors.push({
        field: "basePrice",
        message: "Valid base price is required",
        code: "REQUIRED",
      });
    }

    if (dto.status && !Object.values(ProductStatus).includes(dto.status)) {
      errors.push({
        field: "status",
        message: "Invalid product status",
        code: "INVALID_VALUE",
      });
    }

    if (dto.variants) {
      dto.variants.forEach((variant, index) => {
        if (!variant.sku?.trim()) {
          errors.push({
            field: `variants[${index}].sku`,
            message: "Variant SKU is required",
            code: "REQUIRED",
          });
        }

        if (!variant.price || variant.price.amount < 0) {
          errors.push({
            field: `variants[${index}].price`,
            message: "Valid variant price is required",
            code: "REQUIRED",
          });
        }

        if (variant.stockQuantity < 0) {
          errors.push({
            field: `variants[${index}].stockQuantity`,
            message: "Stock quantity cannot be negative",
            code: "INVALID_VALUE",
          });
        }
      });
    }

    if (errors.length > 0) {
      throw new ValidationException(
        "Product creation validation failed",
        errors
      );
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }
}
