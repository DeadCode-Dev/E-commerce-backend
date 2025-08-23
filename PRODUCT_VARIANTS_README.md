# Product Variants System

## Overview

This e-commerce backend now includes a comprehensive product variants system that allows for managing products with multiple variations (size, color, material, etc.) with individual stock tracking and pricing.

## Database Schema

The system uses the following main tables:

- `categories` - Product categories
- `products` - Base product information
- `product_variants` - Individual variants with SKU, price, stock
- `product_images` - Images associated with products and variants

## Setup Instructions

### 1. Database Migration

Run the migration script to set up the database schema:

```sql
-- Execute the migration script
\i sql/migrate_to_variants.sql
```

This will:

- Create all necessary tables
- Add sample categories and products
- Create product variants with different sizes and colors
- Add sample product images

### 2. API Endpoints

The product API is available at `/api/products` with the following endpoints:

#### Products

- `GET /api/products` - Get all products with pagination
- `GET /api/products/:id` - Get product by ID with variants
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Categories

- `GET /api/products/categories` - Get all categories
- `POST /api/products/categories` - Create new category

#### Variants

- `GET /api/products/:productId/variants` - Get variants for a product
- `POST /api/products/:productId/variants` - Create new variant
- `PUT /api/products/variants/:variantId` - Update variant
- `DELETE /api/products/variants/:variantId` - Delete variant

#### Stock Management

- `PUT /api/products/variants/:variantId/stock` - Update variant stock
- `POST /api/products/variants/:variantId/reserve` - Reserve stock
- `POST /api/products/variants/:variantId/release` - Release reserved stock

## Usage Examples

### Create a Product

```javascript
POST /api/products
{
  "name": "Premium T-Shirt",
  "description": "High-quality cotton t-shirt",
  "brand": "YourBrand",
  "category_id": 1,
  "is_active": true
}
```

### Create Product Variants

```javascript
POST /api/products/1/variants
{
  "sku": "TSHIRT-RED-M",
  "price": 29.99,
  "stock_quantity": 100,
  "attributes": {
    "color": "Red",
    "size": "M",
    "material": "100% Cotton"
  }
}
```

### Get Products with Variants

```javascript
GET / api / products / 1;
// Returns product with all its variants
```

## Architecture

### Models

- `ProductModel` - Handles product CRUD operations
- `VariantModel` - Manages product variants and stock
- `CategoryModel` - Category management

### Services

- `ProductService` - Business logic for products and variants
- Handles validation, stock management, and complex queries

### Controllers

- `ProductController` - HTTP request handling
- Input validation and response formatting

### Types

- Full TypeScript interfaces for type safety
- Database row interfaces for proper typing

## Key Features

1. **Flexible Variant System** - Support for any attributes (color, size, material, etc.)
2. **Stock Management** - Individual stock tracking per variant
3. **Stock Reservation** - Temporary stock holds for checkout process
4. **Image Management** - Multiple images per product and variant
5. **Category System** - Hierarchical product categorization
6. **Type Safety** - Full TypeScript support
7. **Validation** - Input validation and business rules
8. **Error Handling** - Comprehensive error handling

## Database Functions

The system includes PostgreSQL functions for:

- Stock validation before updates
- Automatic stock calculations
- Data integrity checks

## Testing

Run the test suite to verify functionality:

```bash
npm test
```

## Next Steps

1. Integrate with cart system for variant selection
2. Add search and filtering capabilities
3. Implement product reviews for variants
4. Add bulk operations for variant management
5. Set up image upload and processing
