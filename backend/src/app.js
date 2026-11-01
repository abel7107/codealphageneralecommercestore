
import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import {
  authenticateToken,
  requireAdmin,
} from "./middleware/authMiddleware.js";
import cartRoutes from "./routes/cartRoutes.js";

export function createApp(prisma) {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());
  // Authentication routes
  app.use("/api/auth", authRoutes(prisma));

  // Product routes
  app.use("/api/products", productRoutes(prisma)); 
  app.use("/api/cart", cartRoutes(prisma));

  // Health check
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "SHOPORA API is running!",
    });
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Fetch categories error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
      });
    }
  });

  // Create a category (admin only)
  app.post(
    "/api/categories",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const name =
          typeof req.body?.name === "string"
            ? req.body.name.trim()
            : "";

        if (!name) {
          return res.status(400).json({
            success: false,
            message: "Category name is required",
          });
        }

        const category = await prisma.category.create({
          data: { name },
        });

        return res.status(201).json({
          success: true,
          data: category,
        });
      } catch (error) {
        if (error.code === "P2002") {
          return res.status(409).json({
            success: false,
            message: "This category already exists",
          });
        }

        console.error("Create category error:", error);

        return res.status(500).json({
          success: false,
          message: "Failed to create category",
        });
      }
    }
  );

  return app;
}
