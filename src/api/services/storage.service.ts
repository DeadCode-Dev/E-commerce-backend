import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export type ImageSize = "original" | "large" | "medium" | "thumbnail";

interface ProcessedImageResult {
  [key: string]: {
    width: number;
    height: number;
    size: number;
  };
}

class StorageService {
  private uploadsDir: string;
  private maxFileSize: number = 5 * 1024 * 1024; // 5MB
  private allowedMimeTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  private allowedExtensions: string[] = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
  ];

  constructor() {
    this.uploadsDir = path.join(process.cwd(), "uploads");
    this.initializeDirectories();
  }

  private initializeDirectories(): void {
    const directories = [
      this.uploadsDir,
      path.join(this.uploadsDir, "original"),
      path.join(this.uploadsDir, "large"),
      path.join(this.uploadsDir, "medium"),
      path.join(this.uploadsDir, "thumbnail"),
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ): void => {
    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(", ")}`
      );
      cb(error);
      return;
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      const error = new Error(
        `Invalid file extension. Allowed extensions: ${this.allowedExtensions.join(", ")}`
      );
      cb(error);
      return;
    }

    cb(null, true);
  };

  private storage = multer.diskStorage({
    destination: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ): void => {
      cb(null, path.join(this.uploadsDir, "original"));
    },
    filename: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ): void => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  });

  getMulterConfig(): multer.Options {
    return {
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: 10,
      },
    };
  }

  async processAndStoreImage(
    file: Express.Multer.File
  ): Promise<ProcessedImageResult> {
    const filename = file.filename;
    const originalPath = file.path;
    const results: ProcessedImageResult = {};

    try {
      // Get original image metadata
      const originalMetadata = await sharp(originalPath).metadata();
      results.original = {
        width: originalMetadata.width || 0,
        height: originalMetadata.height || 0,
        size: file.size,
      };

      // Process different sizes
      const sizes = {
        large: { width: 1200, height: 1200 },
        medium: { width: 600, height: 600 },
        thumbnail: { width: 200, height: 200 },
      };

      for (const [sizeName, dimensions] of Object.entries(sizes)) {
        const outputPath = path.join(
          this.uploadsDir,
          sizeName,
          `${path.parse(filename).name}.webp`
        );

        const info = await sharp(originalPath)
          .resize(dimensions.width, dimensions.height, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toFile(outputPath);

        results[sizeName] = {
          width: info.width,
          height: info.height,
          size: info.size,
        };
      }

      return results;
    } catch (error) {
      // Clean up on error
      this.deleteImageFiles(filename);
      throw new Error(
        `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  getImageUrl(filename: string, size: ImageSize): string {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    return `${baseUrl}/api/images/${size}/${filename}`;
  }

  getImagePath(filename: string, size: ImageSize): string {
    if (size === "original") {
      return path.join(this.uploadsDir, "original", filename);
    } else {
      const nameWithoutExt = path.parse(filename).name;
      return path.join(this.uploadsDir, size, `${nameWithoutExt}.webp`);
    }
  }

  validateImageExists(filename: string, size: ImageSize): boolean {
    const imagePath = this.getImagePath(filename, size);
    return fs.existsSync(imagePath);
  }

  deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  deleteImageFiles(filename: string): void {
    const sizes: ImageSize[] = ["original", "large", "medium", "thumbnail"];

    sizes.forEach((size) => {
      const imagePath = this.getImagePath(filename, size);
      this.deleteFile(imagePath);
    });
  }

  getImageStats(filename: string): Record<string, { size: number } | null> {
    const sizes: ImageSize[] = ["original", "large", "medium", "thumbnail"];
    const stats: Record<string, { size: number } | null> = {};

    sizes.forEach((size) => {
      const imagePath = this.getImagePath(filename, size);
      try {
        if (fs.existsSync(imagePath)) {
          const fileStat = fs.statSync(imagePath);
          stats[size] = { size: fileStat.size };
        } else {
          stats[size] = null;
        }
      } catch {
        stats[size] = null;
      }
    });

    return stats;
  }

  cleanupOrphanedFiles(): void {
    // This method can be called periodically to clean up files that exist on disk but not in database
    // Implementation would require database access to check which files are still referenced
    console.log("Cleanup orphaned files - implementation needed");
  }
}

export default new StorageService();
