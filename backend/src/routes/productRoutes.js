import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";
import { Router } from "express";

export default function productRoutes(prisma) {
  const router = Router();

  
  // GET /api/products — search, filter, sort, and paginate
  router.get("/", async (req, res) => {
    try {
      const search =
        typeof req.query.search === "string"
          ? req.query.search.trim()
          : "";

      const categoryId =
        req.query.categoryId === undefined
          ? undefined
          : Number(req.query.categoryId);

      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      const allowedSortFields = ["createdAt", "name", "price"];
      const sortBy = allowedSortFields.includes(req.query.sortBy)
        ? req.query.sortBy
        : "createdAt";

      const order = req.query.order === "asc" ? "asc" : "desc";

      if (
        (categoryId !== undefined &&
          (!Number.isSafeInteger(categoryId) || categoryId < 1)) ||
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid filters. Page must be positive, limit must be 1–100, and categoryId must be a positive integer.",
        });
      }

      const where = {
        isActive: true,
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                {
                  description: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { category: true },
          orderBy: { [sortBy]: order },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return res.json({
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("List products failed:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve products",
      });
    }
  });

  // POST /api/products — create product
  router.post("/", authenticateToken, requireAdmin, async (req, res) => {
    const { name, slug, description, price, stock, imageUrl, categoryId } =
      req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      price === undefined ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0 ||
      !Number.isSafeInteger(Number(categoryId)) ||
      Number(categoryId) < 1 ||
      (stock !== undefined &&
        (!Number.isSafeInteger(stock) || stock < 0)) ||
      (description !== undefined && typeof description !== "string") ||
      (imageUrl !== undefined &&
        imageUrl !== null &&
        typeof imageUrl !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product fields",
      });
    }

    try {
      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          slug,
          description: description?.trim() || null,
          price: Number(price),
          stock: stock ?? 0,
          imageUrl: imageUrl || null,
          categoryId: Number(categoryId),
        },
        include: { category: true },
      });

      return res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "That product slug already exists",
        });
      }

      if (error.code === "P2003" || error.code === "P2025") {
        return res.status(400).json({
          success: false,
          message: "The selected category does not exist",
        });
      }

      console.error("Create product failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to create product",
      });
    }
  });

  // PUT /api/products/:id — update product
  router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { name, slug, description, price, stock, imageUrl, categoryId } =
      req.body ?? {};

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const data = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ success: false, message: "Invalid name" });
      }
      data.name = name.trim();
    }

    if (slug !== undefined) {
      if (
        typeof slug !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ) {
        return res.status(400).json({ success: false, message: "Invalid slug" });
      }
      data.slug = slug;
    }

    if (description !== undefined) {
      if (typeof description !== "string" && description !== null) {
        return res.status(400).json({
          success: false,
          message: "Invalid description",
        });
      }
      data.description = description?.trim() || null;
    }

    if (price !== undefined) {
      if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
        return res.status(400).json({ success: false, message: "Invalid price" });
      }
      data.price = Number(price);
    }

    if (stock !== undefined) {
      if (!Number.isSafeInteger(stock) || stock < 0) {
        return res.status(400).json({ success: false, message: "Invalid stock" });
      }
      data.stock = stock;
    }

    if (imageUrl !== undefined) {
      if (typeof imageUrl !== "string" && imageUrl !== null) {
        return res.status(400).json({
          success: false,
          message: "Invalid image URL",
        });
      }
      data.imageUrl = imageUrl || null;
    }

    if (categoryId !== undefined) {
      if (!Number.isSafeInteger(Number(categoryId)) || Number(categoryId) < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
      data.categoryId = Number(categoryId);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    try {
      const product = await prisma.product.update({
        where: { id },
        data,
        include: { category: true },
      });

      res.json({ success: true, data: product });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "That product slug already exists",
        });
      }

      if (error.code === "P2025" || error.code === "P2003") {
        return res.status(404).json({
          success: false,
          message: "Product or category not found",
        });
      }

      console.error("Update product failed:", error);
      res.status(500).json({
        success: false,
        message: "Unable to update product",
      });
    }
  });

  // DELETE /api/products/:id — remove product
  router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    try {
      await prisma.product.delete({ where: { id } });

      res.status(204).end();
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      console.error("Delete product failed:", error);
      res.status(500).json({
        success: false,
        message: "Unable to delete product",
      });
    }
  });

  return router;
}
