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

export { ProcessedImageInfo, UploadResponse };
