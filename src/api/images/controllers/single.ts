import { Request, Response } from "express";
import storageService from "@/services/storage.service";
import ImageModel from "@/models/image.model";

export default async function singleUpload(req: Request, res: Response) {
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
    const processedImages = await storageService.processAndStoreImage(req.file);

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
          thumbnail: storageService.getImageUrl(req.file.filename, "thumbnail"),
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
