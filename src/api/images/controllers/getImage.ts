import { Request, Response } from "express";
import storageService from "@/services/storage.service";
import fs from "fs";
import path from "path";
export default async function getImage(req: Request, res: Response) {
  try {
    const { size, filename } = req.params;

    // Validate size parameter
    const allowedSizes = ["original", "large", "medium", "thumbnail"] as const;
    type ImageSize = (typeof allowedSizes)[number];

    if (!allowedSizes.includes(size as ImageSize)) {
      res.status(400).json({
        success: false,
        message: "Invalid size parameter. Allowed: " + allowedSizes.join(", "),
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

    const imagePath = storageService.getImagePath(filename, size as ImageSize);
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
