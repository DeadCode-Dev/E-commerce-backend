# Product API - Merge-Based Update System

## Overview

The Product API now supports a merge-based update system that allows the frontend to:

1. Fetch complete product data for editing
2. Send back only the modified fields
3. Merge changes with existing data safely

## API Endpoints

### Get Product for Editing

```
GET /products/:id/edit
```

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Product Name",
      "description": "Product Description"
    },
    "variants": [
      {
        "variant_id": 1,
        "size": "M",
        "color": "Red",
        "stock": 10,
        "price": 29.99,
        "is_available": true
      }
    ],
    "images": [
      {
        "id": 1,
        "image_url": "https://...",
        "alt_text": "Product image",
        "display_order": 0
      }
    ],
    "categories": ["Clothing", "T-Shirts"],
    "last_updated": "2025-09-06T23:47:58.535Z"
  }
}
```

### Update Product (Merge)

```
PUT /products/:id
```

**Headers:** Authorization required

**Request Body (Merge Format):**

```json
{
  "product": {
    "name": "Updated Product Name",
    "description": "Updated Description"
  },
  "variants": [
    {
      "id": 1, // Existing variant - will be updated
      "size": "M",
      "color": "Blue", // Changed color
      "stock": 15, // Changed stock
      "price": 29.99
    },
    {
      // No id - new variant will be created
      "size": "L",
      "color": "Blue",
      "stock": 5,
      "price": 34.99
    }
  ],
  "categories": ["Clothing", "T-Shirts", "New Category"],
  "last_updated": "2025-09-06T23:47:58.535Z"
}
```

**Alternative Simple Update:**

```json
{
  "name": "Updated Product Name",
  "description": "Updated Description"
}
```

## Frontend Workflow Example

### Using Filter Options for Search UI

```javascript
// 1. Get filter options when page loads
const filtersResponse = await fetch("/api/products/filters");
const { data: filterOptions } = await filtersResponse.json();

// 2. Build search UI with dropdowns
const searchForm = {
  categories: filterOptions.categories, // ["Clothing", "Electronics"]
  sizes: filterOptions.sizes, // ["S", "M", "L", "XL"]
  colors: filterOptions.colors, // ["Red", "Blue", "Green"]
  priceRange: filterOptions.priceRange, // {min: 5.99, max: 999.99}
  sortOptions: filterOptions.sortOptions,
};

// 3. User selects filters and searches
const searchParams = new URLSearchParams({
  category: "Clothing",
  size: "M",
  color: "Blue",
  minPrice: "20",
  maxPrice: "100",
  sortBy: "price",
  sortOrder: "ASC",
});

const searchResponse = await fetch(`/api/products/search?${searchParams}`);
const searchResults = await searchResponse.json();
```

### Product Editing Workflow

```javascript
// 1. Get product for editing
const response = await fetch("/api/products/123/edit", {
  headers: { Authorization: "Bearer " + token },
});
const { data } = await response.json();

// 2. User modifies data in frontend
const modifiedData = {
  ...data,
  product: {
    ...data.product,
    name: "New Name", // User changed name
  },
  variants: data.variants.map((variant) =>
    variant.variant_id === 1
      ? { ...variant, stock: variant.stock + 10 } // User updated stock
      : variant
  ),
};

// 3. Send back only what changed (or full data for safety)
const updateResponse = await fetch("/api/products/123", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  },
  body: JSON.stringify({
    product: modifiedData.product,
    variants: modifiedData.variants,
    categories: modifiedData.categories,
    last_updated: data.last_updated,
  }),
});
```

## Other Endpoints

### Get Filter Options (NEW!)

```
GET /products/filters
```

**Description:** Get all available filter options for search dropdowns

**Response:**

```json
{
  "success": true,
  "data": {
    "categories": ["Clothing", "Electronics", "Books"],
    "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
    "colors": ["Red", "Blue", "Green", "Black", "White"],
    "priceRange": {
      "min": 5.99,
      "max": 999.99
    },
    "brands": [],
    "sortOptions": [
      { "value": "name", "label": "Name" },
      { "value": "price", "label": "Price" },
      { "value": "created_at", "label": "Newest" },
      { "value": "popularity", "label": "Popular" }
    ],
    "sortOrders": [
      { "value": "ASC", "label": "Ascending" },
      { "value": "DESC", "label": "Descending" }
    ]
  }
}
```

### List Products

```
GET /products?limit=20&offset=0
```

### Get Single Product

```
GET /products/:id
```

### Search Products

```
GET /products/search?name=shirt&category=clothing&minPrice=10&maxPrice=50
```

### Get Product Variants

```
GET /products/:id/variants?size=M&color=Red
```

### Get Available Sizes/Colors

```
GET /products/:id/sizes
GET /products/:id/colors
```

### Create Product

```
POST /products
```

**Headers:** Authorization required + Admin role

### Create Product Variants

```
POST /products/variants
```

**Headers:** Authorization required + Admin role

### Update Stock Only

```
PUT /products/:id/stock
```

**Headers:** Authorization required + Admin role

**Body:**

```json
{
  "variant_id": 1,
  "stock": 25
}
```

### Delete Product

```
DELETE /products/:id
```

**Headers:** Authorization required + Admin role

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation Error",
    "details": "Specific error details"
  }
}
```

## Notes

- All admin operations require authentication AND admin role (`role: "admin"`)
- Public endpoints (GET operations) do not require authentication
- Filter options endpoint provides distinct values for search dropdowns
- The merge system preserves existing data and only updates provided fields
- Variants with IDs are updated, variants without IDs are created as new
- Categories are additive (new categories are added, existing ones remain)
- Images management should use the separate `/images` API endpoints
- The `last_updated` field can be used for conflict detection in future versions
