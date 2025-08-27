import { Request, Response } from "express";
import ImageModel from "@/models/image.model";
import storageService from "@/services/storage.service";
import path from "path";

export default async function deleteImage(
  req: Request,
  res: Response
): Promise<void> {
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
