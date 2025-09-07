import { Request, Response } from "express";
import ImageModel from "@/models/image.model";
import path from "path";
import storageService from "@/services/storage.service";

export default async (req: Request, res: Response): Promise<void> => {
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
        file_stats: (
          Object.keys(stats) as Array<
            "original" | "large" | "medium" | "thumbnail"
          >
        ).map((size) => ({
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
};
