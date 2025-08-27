import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";
import { Request } from "express";

export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface ProcessedImage {
  filename: string;
  path: string;
  size: number;
  width: number;
  height: number;
  format: string;
}

export class StorageService {
  private uploadDir: string;
  private allowedMimeTypes: string[];
  private maxFileSize: number;
  private maxFiles: number;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads", "images");
    this.allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.maxFiles = 10;

    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // Create subdirectories for different image sizes
    const subdirs = ["original", "thumbnail", "medium", "large"];
    subdirs.forEach((subdir) => {
      const subdirPath = path.join(this.uploadDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
      }
    });
  }

  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString("hex");
    return `${timestamp}-${randomBytes}${ext}`;
  }

  private fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ): void => {
    // Check if file is an image
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      cb(
        new Error(
          `Invalid file type. Only ${this.allowedMimeTypes.join(", ")} are allowed.`
        )
      );
      return;
    }

    // Additional file extension check
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!allowedExtensions.includes(ext)) {
      cb(new Error("Invalid file extension."));
      return;
    }

    cb(null, true);
  };

  private storage = multer.diskStorage({
    destination: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) => {
      cb(null, path.join(this.uploadDir, "original"));
    },
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ) => {
      const filename = this.generateFilename(file.originalname);
      cb(null, filename);
    },
  });

  public getMulterConfig(): multer.Options {
    return {
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: this.maxFiles,
      },
    };
  }

  public async processAndStoreImage(
    file: Express.Multer.File
  ): Promise<Record<string, ProcessedImage>> {
    const filename = path.parse(file.filename).name;
    const originalPath = file.path;

    try {
      // Get image metadata
      const metadata = await sharp(originalPath).metadata();

      // Process different sizes
      const sizes = {
        thumbnail: { width: 150, height: 150 },
        medium: { width: 500, height: 500 },
        large: { width: 1200, height: 1200 },
      };

      const processedImages: Record<string, ProcessedImage> = {
        original: {
          filename: file.filename,
          path: originalPath,
          size: file.size,
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || "unknown",
        },
      };

      // Generate different sizes
      for (const [sizeName, dimensions] of Object.entries(sizes)) {
        const outputFilename = `${filename}.webp`;
        const outputPath = path.join(this.uploadDir, sizeName, outputFilename);

        await sharp(originalPath)
          .resize(dimensions.width, dimensions.height, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 80 })
          .toFile(outputPath);

        const stats = fs.statSync(outputPath);
        const processedMetadata = await sharp(outputPath).metadata();

        processedImages[sizeName] = {
          filename: outputFilename,
          path: outputPath,
          size: stats.size,
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
          format: "webp",
        };
      }

      return processedImages;
    } catch (error) {
      // Clean up original file if processing fails
      this.deleteFile(originalPath);
      throw new Error(
        `Image processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }

  public deleteImageFiles(filename: string): void {
    const baseName = path.parse(filename).name;
    const sizes = ["original", "thumbnail", "medium", "large"];

    sizes.forEach((size) => {
      const filePath =
        size === "original"
          ? path.join(this.uploadDir, size, filename)
          : path.join(this.uploadDir, size, `${baseName}.webp`);

      this.deleteFile(filePath);
    });
  }

  public getImagePath(
    filename: string,
    size: "original" | "thumbnail" | "medium" | "large" = "original"
  ): string {
    if (size === "original") {
      return path.join(this.uploadDir, size, filename);
    } else {
      const baseName = path.parse(filename).name;
      return path.join(this.uploadDir, size, `${baseName}.webp`);
    }
  }

  public getImageUrl(
    filename: string,
    size: "original" | "thumbnail" | "medium" | "large" = "original"
  ): string {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    if (size === "original") {
      return `${baseUrl}/api/images/${size}/${filename}`;
    } else {
      const baseName = path.parse(filename).name;
      return `${baseUrl}/api/images/${size}/${baseName}.webp`;
    }
  }

  public validateImageExists(
    filename: string,
    size: "original" | "thumbnail" | "medium" | "large" = "original"
  ): boolean {
    const imagePath = this.getImagePath(filename, size);
    return fs.existsSync(imagePath);
  }

  public getImageStats(filename: string): {
    original?: fs.Stats;
    thumbnail?: fs.Stats;
    medium?: fs.Stats;
    large?: fs.Stats;
  } {
    const stats: Record<string, fs.Stats> = {};
    const sizes: Array<"original" | "thumbnail" | "medium" | "large"> = [
      "original",
      "thumbnail",
      "medium",
      "large",
    ];

    sizes.forEach((size) => {
      const imagePath = this.getImagePath(filename, size);
      if (fs.existsSync(imagePath)) {
        stats[size] = fs.statSync(imagePath);
      }
    });

    return stats;
  }
}

export default new StorageService();
