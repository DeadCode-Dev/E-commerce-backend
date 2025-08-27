import { Router } from "express";
import multer from "multer";
import storageService from "../../services/storage.service";
import { isAuthenticated, Role } from "@/middlewares/auth";
import singleUpload from "./controllers/single";
import getImage from "./controllers/getImage";
import deleteImage from "./controllers/delete";
import getInfo from "./controllers/getInfo";

const router = Router();
const upload = multer(storageService.getMulterConfig());

// Upload single image
router.post(
  "/upload/single",
  isAuthenticated,
  Role("admin"),
  upload.single("image"),
  singleUpload
);

// Upload multiple images
router.post(
  "/upload/multiple",
  isAuthenticated,
  Role("admin"),
  upload.array("images", 10),
);

// Serve images
router.get(
  "/:size/:filename",
  getImage
);

// Delete image
router.delete(
  "/:imageId",
  deleteImage
);

// Get image info
router.get(
  "/info/:imageId",
  getInfo
);

export default router;
