import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import storageService from "../services/storage.service";
import ImageModel from "../../models/image.model";

const router = Router();
const upload = multer(storageService.getMulterConfig());

interface ProcessedImageInfo {
  image_id: number;
  filename: string;
  original_name: string;
  size: number;
  urls: {
    original: string;
    large: string;
    medium: string;
    thumbnail: string;
  };
  processed_sizes: Array<{
    size: string;
    width: number;
    height: number;
    file_size: number;
  }>;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    uploaded_images: ProcessedImageInfo[];
    total_uploaded: number;
    total_attempted: number;
  };
  errors?: Array<{
    filename: string;
    error: string;
  }>;
}

// Upload single image
router.post(
  "/upload/single",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      const productId = req.body.product_id;
      if (!productId) {
        // Clean up uploaded file
        storageService.deleteFile(req.file.path);
        res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
        return;
      }

      // Process and store different sizes
      const processedImages = await storageService.processAndStoreImage(
        req.file
      );

      // Store image metadata in database
      const imageData = {
        product_id: parseInt(productId),
        image_url: storageService.getImageUrl(req.file.filename, "original"),
        alt_text: req.body.alt_text || null,
      };

      const savedImage = await ImageModel.createImage(imageData);

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          image_id: savedImage.id,
          filename: req.file.filename,
          original_name: req.file.originalname,
          size: req.file.size,
          urls: {
            original: storageService.getImageUrl(req.file.filename, "original"),
            large: storageService.getImageUrl(req.file.filename, "large"),
            medium: storageService.getImageUrl(req.file.filename, "medium"),
            thumbnail: storageService.getImageUrl(
              req.file.filename,
              "thumbnail"
            ),
          },
          processed_sizes: Object.keys(processedImages).map((size) => ({
            size,
            width: processedImages[size].width,
            height: processedImages[size].height,
            file_size: processedImages[size].size,
          })),
        },
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        storageService.deleteImageFiles(req.file.filename);
      }

      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Upload multiple images
router.post(
  "/upload/multiple",
  upload.array("images", 10),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
        return;
      }

      const productId = req.body.product_id;
      if (!productId) {
        // Clean up uploaded files
        req.files.forEach((file) => storageService.deleteFile(file.path));
        res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
        return;
      }

      const uploadedImages = [];
      const errors = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const altText = req.body.alt_texts ? req.body.alt_texts[i] : null;

        try {
          // Process and store different sizes
          const processedImages =
            await storageService.processAndStoreImage(file);

          // Store image metadata in database
          const imageData = {
            product_id: parseInt(productId),
            image_url: storageService.getImageUrl(file.filename, "original"),
            alt_text: altText || null,
          };

          const savedImage = await ImageModel.createImage(imageData);

          uploadedImages.push({
            image_id: savedImage.id,
            filename: file.filename,
            original_name: file.originalname,
            size: file.size,
            urls: {
              original: storageService.getImageUrl(file.filename, "original"),
              large: storageService.getImageUrl(file.filename, "large"),
              medium: storageService.getImageUrl(file.filename, "medium"),
              thumbnail: storageService.getImageUrl(file.filename, "thumbnail"),
            },
            processed_sizes: Object.keys(processedImages).map((size) => ({
              size,
              width: processedImages[size].width,
              height: processedImages[size].height,
              file_size: processedImages[size].size,
            })),
          });
        } catch (error) {
          // Clean up this specific file on error
          storageService.deleteImageFiles(file.filename);
          errors.push({
            filename: file.originalname,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const response: UploadResponse = {
        success: uploadedImages.length > 0,
        message: `${uploadedImages.length} of ${req.files.length} images uploaded successfully`,
        data: {
          uploaded_images: uploadedImages,
          total_uploaded: uploadedImages.length,
          total_attempted: req.files.length,
        },
      };

      if (errors.length > 0) {
        response.errors = errors;
      }

      const statusCode = uploadedImages.length > 0 ? 201 : 400;
      res.status(statusCode).json(response);
    } catch (error) {
      // Clean up all uploaded files on general error
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file) =>
          storageService.deleteImageFiles(file.filename)
        );
      }

      console.error("Multiple upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload images",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Serve images
router.get(
  "/:size/:filename",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { size, filename } = req.params;

      // Validate size parameter
      const allowedSizes = [
        "original",
        "large",
        "medium",
        "thumbnail",
      ] as const;
      type ImageSize = (typeof allowedSizes)[number];

      if (!allowedSizes.includes(size as ImageSize)) {
        res.status(400).json({
          success: false,
          message:
            "Invalid size parameter. Allowed: " + allowedSizes.join(", "),
        });
        return;
      }

      // Check if image exists
      if (!storageService.validateImageExists(filename, size as ImageSize)) {
        res.status(404).json({
          success: false,
          message: "Image not found",
        });
        return;
      }

      const imagePath = storageService.getImagePath(
        filename,
        size as ImageSize
      );
      const stats = fs.statSync(imagePath);

      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
      };

      const mimeType =
        size === "original"
          ? mimeTypes[ext] || "application/octet-stream"
          : "image/webp";

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.setHeader("ETag", `"${stats.mtime.getTime()}-${stats.size}"`);

      // Check if client has cached version
      const clientETag = req.headers["if-none-match"];
      if (clientETag === res.getHeader("ETag")) {
        res.status(304).end();
        return;
      }

      // Stream the file
      const stream = fs.createReadStream(imagePath);
      stream.pipe(res);
    } catch (error) {
      console.error("Serve image error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to serve image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Delete image
router.delete(
  "/:imageId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const imageId = parseInt(req.params.imageId);

      if (isNaN(imageId)) {
        res.status(400).json({
          success: false,
          message: "Invalid image ID",
        });
        return;
      }

      // Get image details from database
      const image = await ImageModel.findImageById(imageId);
      if (!image) {
        res.status(404).json({
          success: false,
          message: "Image not found",
        });
        return;
      }

      // Extract filename from URL
      const filename = path.basename(image.image_url);

      // Delete all image files (all sizes)
      storageService.deleteImageFiles(filename);

      // Delete from database
      await ImageModel.deleteImage(imageId);

      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Delete image error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get image info
router.get(
  "/info/:imageId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const imageId = parseInt(req.params.imageId);

      if (isNaN(imageId)) {
        res.status(400).json({
          success: false,
          message: "Invalid image ID",
        });
        return;
      }

      const image = await ImageModel.findImageById(imageId);
      if (!image) {
        res.status(404).json({
          success: false,
          message: "Image not found",
        });
        return;
      }

      const filename = path.basename(image.image_url);
      const stats = storageService.getImageStats(filename);

      res.json({
        success: true,
        data: {
          id: image.id,
          product_id: image.product_id,
          filename,
          alt_text: image.alt_text,
          display_order: image.display_order,
          urls: {
            original: storageService.getImageUrl(filename, "original"),
            large: storageService.getImageUrl(filename, "large"),
            medium: storageService.getImageUrl(filename, "medium"),
            thumbnail: storageService.getImageUrl(filename, "thumbnail"),
          },
          file_stats: Object.keys(stats).map((size) => ({
            size,
            file_size: stats[size]?.size || 0,
            exists: !!stats[size],
          })),
        },
      });
    } catch (error) {
      console.error("Get image info error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get image info",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
