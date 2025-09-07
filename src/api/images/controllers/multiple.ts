import { Request, Response } from "express";
import storageService from "@/services/storage.service";
import ImageModel from "@/models/image.model";
import { UploadResponse } from "../image.types";
export default async function multipleUpload(req: Request, res: Response) {
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
        const processedImages = await storageService.processAndStoreImage(file);

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
        storageService.deleteImageFiles(file.filename),
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
