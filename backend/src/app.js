
import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import {
  authenticateToken,
  requireAdmin,
} from "./middleware/authMiddleware.js";
import cartRoutes from "./routes/cartRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "node:path";
import orderRoutes from "./routes/orderRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

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
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  // Authentication routes
  app.use("/api/auth", authRoutes(prisma));

  // Product routes
  app.use("/api/products", productRoutes(prisma)); 
  app.use("/api/cart", cartRoutes(prisma));
  app.use("/api/orders", orderRoutes(prisma));
  app.use("/api/admin/orders", adminOrderRoutes(prisma));
  app.use("/api/admin/customers", customerRoutes(prisma));
  app.use("/api/admin/analytics", adminAnalyticsRoutes(prisma));
  app.use("/api/admin/settings", settingsRoutes(prisma));
  app.use("/api/uploads", uploadRoutes(prisma));

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
        include: { _count: { select: { products: true } } },
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

  // Update a category (admin only)
  app.put(
    "/api/categories/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      if (!name) {
        return res.status(400).json({ success: false, message: "Category name is required" });
      }
      try {
        const category = await prisma.category.update({
          where: { id },
          data: { name },
          include: { _count: { select: { products: true } } },
        });
        return res.json({ success: true, data: category });
      } catch (error) {
        if (error.code === "P2002") {
          return res.status(409).json({ success: false, message: "This category already exists" });
        }
        if (error.code === "P2025") {
          return res.status(404).json({ success: false, message: "Category not found" });
        }
        console.error("Update category error:", error);
        return res.status(500).json({ success: false, message: "Failed to update category" });
      }
    }
  );

  // Delete a category (admin only)
  app.delete(
    "/api/categories/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      try {
        const category = await prisma.category.findUnique({
          where: { id },
          include: { _count: { select: { products: true } } },
        });
        if (!category) {
          return res.status(404).json({ success: false, message: "Category not found" });
        }
        if (category._count.products > 0) {
          return res.status(409).json({ success: false, message: "Category is in use by products" });
        }
        await prisma.category.delete({ where: { id } });
        return res.status(204).end();
      } catch (error) {
        console.error("Delete category error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete category" });
      }
    }
  );

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
