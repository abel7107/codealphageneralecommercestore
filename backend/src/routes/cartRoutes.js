
import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";

export default function cartRoutes(prisma) {
  const router = Router();

  // All cart endpoints require authentication.
  router.use(authenticateToken);

  // Reusable cart response with product information.
  async function getCart(userId) {
    return prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  // GET /api/cart — get the current user's cart.
  router.get("/", async (req, res) => {
    try {
      const cart = await getCart(req.user.id);

      return res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error("Get cart failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to retrieve cart",
      });
    }
  });

  // POST /api/cart/items — add a product to the cart.
  router.post("/items", async (req, res) => {
    const productId = Number(req.body?.productId);
    const quantity = req.body?.quantity ?? 1;

    if (
      !Number.isSafeInteger(productId) ||
      productId < 1 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID and quantity are required",
      });
    }

    try {
      const cart = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findFirst({
          where: {
            id: productId,
            isActive: true,
          },
        });

        if (!product) {
          const error = new Error("Product not found");
          error.status = 404;
          throw error;
        }

        const currentCart = await tx.cart.upsert({
          where: { userId: req.user.id },
          create: { userId: req.user.id },
          update: {},
        });

        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: currentCart.id,
              productId,
            },
          },
        });

        const newQuantity = (existingItem?.quantity ?? 0) + quantity;

        if (newQuantity > product.stock) {
          const error = new Error("Requested quantity exceeds available stock");
          error.status = 400;
          throw error;
        }

        await tx.cartItem.upsert({
          where: {
            cartId_productId: {
              cartId: currentCart.id,
              productId,
            },
          },
          create: {
            cartId: currentCart.id,
            productId,
            quantity,
          },
          update: {
            quantity: newQuantity,
          },
        });

        return tx.cart.findUnique({
          where: { id: currentCart.id },
          include: {
            items: {
              include: { product: true },
            },
          },
        });
      });

      return res.status(200).json({
        success: true,
        message: "Product added to cart",
        data: cart,
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Add to cart failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to add product to cart",
      });
    }
  });

  // PATCH /api/cart/items/:productId — set an item's quantity.
  router.patch("/items/:productId", async (req, res) => {
    const productId = Number(req.params.productId);
    const quantity = req.body?.quantity;

    if (
      !Number.isSafeInteger(productId) ||
      productId < 1 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID and positive quantity are required",
      });
    }

    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }

      const item = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        include: { product: true },
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        });
      }

      if (!item.product.isActive || quantity > item.product.stock) {
        return res.status(400).json({
          success: false,
          message: "Requested quantity is unavailable",
        });
      }

      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });

      const updatedCart = await getCart(req.user.id);

      return res.json({
        success: true,
        message: "Cart quantity updated",
        data: updatedCart,
      });
    } catch (error) {
      console.error("Update cart item failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to update cart item",
      });
    }
  });

  // DELETE /api/cart/items/:productId — remove one item.
  router.delete("/items/:productId", async (req, res) => {
    const productId = Number(req.params.productId);

    if (!Number.isSafeInteger(productId) || productId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }

      const result = await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        });
      }

      return res.json({
        success: true,
        message: "Product removed from cart",
        data: await getCart(req.user.id),
      });
    } catch (error) {
      console.error("Remove cart item failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to remove cart item",
      });
    }
  });

  // DELETE /api/cart — empty the current user's cart.
  router.delete("/", async (req, res) => {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
      });

      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      return res.json({
        success: true,
        message: "Cart cleared successfully",
      });
    } catch (error) {
      console.error("Clear cart failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to clear cart",
      });
    }
  });

  return router;
}
