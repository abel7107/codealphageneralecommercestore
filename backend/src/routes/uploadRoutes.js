import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const uploadDir = path.resolve(process.cwd(), "uploads", "products");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${baseName || "image"}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export default function uploadRoutes(prisma) {
  const router = Router();
  router.use(authenticateToken, requireAdmin);

  router.post("/product-image", (req, res) => {
    upload.single("image")(req, res, (error) => {
      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "Image file is required" });
      }

      return res.status(201).json({
        success: true,
        data: {
          url: `/uploads/products/${req.file.filename}`,
        },
      });
    });
  });

  return router;
}
