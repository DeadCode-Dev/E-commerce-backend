# Image Upload API Documentation

This API provides secure image upload functionality with automatic resizing and multiple format support.

## Features

- **Multiple Image Sizes**: Automatically generates thumbnail (200x200), medium (600x600), large (1200x1200), and preserves original
- **Format Optimization**: Converts images to WebP for better compression (except original)
- **Security**: File type validation, size limits, and secure filename generation
- **File Management**: Automatic cleanup on errors and deletion endpoints
- **Database Integration**: Stores metadata in database with ImageModel

## API Endpoints

### 1. Upload Single Image

```
POST /api/images/upload/single
Content-Type: multipart/form-data

Body:
- image: File (required) - Image file to upload
- product_id: Number (required) - Product ID to associate with image
- alt_text: String (optional) - Alt text for accessibility
```

**Response:**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image_id": 123,
    "filename": "uuid-filename.jpg",
    "original_name": "photo.jpg",
    "size": 1024000,
    "urls": {
      "original": "http://localhost:3000/api/images/original/uuid-filename.jpg",
      "large": "http://localhost:3000/api/images/large/uuid-filename.webp",
      "medium": "http://localhost:3000/api/images/medium/uuid-filename.webp",
      "thumbnail": "http://localhost:3000/api/images/thumbnail/uuid-filename.webp"
    },
    "processed_sizes": [
      { "size": "thumbnail", "width": 200, "height": 150, "file_size": 15000 },
      { "size": "medium", "width": 600, "height": 450, "file_size": 45000 },
      { "size": "large", "width": 1200, "height": 900, "file_size": 120000 }
    ]
  }
}
```

### 2. Upload Multiple Images

```
POST /api/images/upload/multiple
Content-Type: multipart/form-data

Body:
- images: File[] (required) - Array of image files (max 10)
- product_id: Number (required) - Product ID to associate with images
- alt_texts: String[] (optional) - Array of alt texts corresponding to images
```

**Response:**

```json
{
  "success": true,
  "message": "3 of 3 images uploaded successfully",
  "data": {
    "uploaded_images": [...], // Array of image objects like single upload
    "total_uploaded": 3,
    "total_attempted": 3
  }
}
```

### 3. Serve Images

```
GET /api/images/:size/:filename

Parameters:
- size: String (original|large|medium|thumbnail)
- filename: String - The filename returned from upload
```

**Headers Set:**

- Content-Type: image/jpeg, image/png, image/webp, etc.
- Cache-Control: public, max-age=31536000 (1 year)
- ETag: For client-side caching

### 4. Delete Image

```
DELETE /api/images/:imageId

Parameters:
- imageId: Number - Database ID of the image
```

**Response:**

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### 5. Get Image Information

```
GET /api/images/info/:imageId

Parameters:
- imageId: Number - Database ID of the image
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "product_id": 456,
    "filename": "uuid-filename.jpg",
    "alt_text": "Product photo",
    "display_order": 1,
    "urls": {
      "original": "http://localhost:3000/api/images/original/uuid-filename.jpg",
      "large": "http://localhost:3000/api/images/large/uuid-filename.webp",
      "medium": "http://localhost:3000/api/images/medium/uuid-filename.webp",
      "thumbnail": "http://localhost:3000/api/images/thumbnail/uuid-filename.webp"
    },
    "file_stats": [
      { "size": "original", "file_size": 1024000, "exists": true },
      { "size": "large", "file_size": 120000, "exists": true },
      { "size": "medium", "file_size": 45000, "exists": true },
      { "size": "thumbnail", "file_size": 15000, "exists": true }
    ]
  }
}
```

## Configuration

### File Restrictions

- **Max File Size**: 5MB per file
- **Max Files**: 10 files per upload (multiple upload)
- **Allowed Types**: JPEG, PNG, WebP, GIF
- **Allowed Extensions**: .jpg, .jpeg, .png, .webp, .gif

### Image Sizes

- **Thumbnail**: 200x200px (WebP)
- **Medium**: 600x600px (WebP)
- **Large**: 1200x1200px (WebP)
- **Original**: Unchanged format and size

### Storage Structure

```
uploads/
├── original/     # Original uploaded files
├── large/        # 1200x1200 WebP files
├── medium/       # 600x600 WebP files
└── thumbnail/    # 200x200 WebP files
```

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Error Codes

- **400**: Bad request (missing files, invalid product_id, file type errors)
- **404**: Image not found
- **500**: Server error (processing failed, database error)

### Multer Errors

- `LIMIT_FILE_SIZE`: File exceeds 5MB limit
- `LIMIT_FILE_COUNT`: More than 10 files uploaded
- `LIMIT_UNEXPECTED_FILE`: Wrong field name used

## Usage Examples

### JavaScript/Fetch API

```javascript
// Single image upload
const formData = new FormData();
formData.append("image", fileInput.files[0]);
formData.append("product_id", "123");
formData.append("alt_text", "Product photo");

const response = await fetch("/api/images/upload/single", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log("Uploaded:", result.data.urls);
```

### Multiple images upload

```javascript
const formData = new FormData();
Array.from(fileInput.files).forEach((file) => {
  formData.append("images", file);
});
formData.append("product_id", "123");

const response = await fetch("/api/images/upload/multiple", {
  method: "POST",
  body: formData,
});
```

### cURL Examples

```bash
# Single upload
curl -X POST http://localhost:3000/api/images/upload/single \
  -F "image=@photo.jpg" \
  -F "product_id=123" \
  -F "alt_text=Product photo"

# Multiple upload
curl -X POST http://localhost:3000/api/images/upload/multiple \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.png" \
  -F "product_id=123"

# Get image
curl http://localhost:3000/api/images/medium/uuid-filename.webp

# Delete image
curl -X DELETE http://localhost:3000/api/images/123
```

## Integration with Main App

To integrate with your Express app:

```typescript
import express from "express";
import imagesAPI from "./api/images";

const app = express();

// Mount images API
app.use("/api", imagesAPI);

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## Environment Variables

Set these in your `.env` file:

```env
BASE_URL=http://localhost:3000
# Used for generating image URLs in responses
```

## Notes

- Images are automatically processed using Sharp for optimal quality and size
- All processed images use WebP format for better compression
- Original images maintain their uploaded format
- File cleanup happens automatically on upload errors
- Image serving includes proper caching headers for performance
- ETag support for client-side caching
