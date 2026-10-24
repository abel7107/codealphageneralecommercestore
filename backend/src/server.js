
import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";
import "dotenv/config";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import {
  authenticateToken,
  requireAdmin,
} from "./middleware/authMiddleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());


// Connect Prisma to PostgreSQL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
console.log("Prisma category:", typeof prisma.category);
console.log("Prisma product:", typeof prisma.product);
app.use("/api/auth", authRoutes(prisma));
app.use("/api/products", productRoutes(prisma));

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

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

// Create a category
    app.post(
      "/api/categories",
      authenticateToken,
      requireAdmin,
      async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json({
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
    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`SHOPORA API running at http://localhost:${PORT}`);
});

// Close Prisma cleanly when the process exits
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
