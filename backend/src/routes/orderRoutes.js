import { Router } from "express";
import crypto from "node:crypto";
import { authenticateToken } from "../middleware/authMiddleware.js";

const VALID_PAYMENT_METHODS = ["COD", "CARD", "BANK_TRANSFER"];

export default function orderRoutes(prisma) {
  const router = Router();
  router.use(authenticateToken);

  function parseItems(body) {
    if (Array.isArray(body?.items) && body.items.length > 0) {
      return body.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      }));
    }
    return null;
  }

  function validateItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return "At least one order item is required";
    }
    for (const item of items) {
      if (!Number.isSafeInteger(item.productId) || item.productId < 1) {
        return "Invalid product ID";
      }
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
        return "Invalid quantity";
      }
    }
    return null;
  }

  // POST /api/orders
  router.post("/", async (req, res) => {
    const shipping = req.body?.shipping ?? {};
    const paymentMethod = req.body?.paymentMethod ?? "COD";
    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : null;

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    const shippingFullName = typeof shipping.fullName === "string" ? shipping.fullName.trim() : "";
    const shippingPhone = typeof shipping.phone === "string" ? shipping.phone.trim() : "";
    const shippingAddress = typeof shipping.address === "string" ? shipping.address.trim() : "";
    const shippingCity = typeof shipping.city === "string" ? shipping.city.trim() : "";
    const shippingEmail = typeof shipping.email === "string" ? shipping.email.trim().toLowerCase() : null;
    const shippingPostalCode = typeof shipping.postalCode === "string" ? shipping.postalCode.trim() : null;
    const shippingCountry = typeof shipping.country === "string" ? shipping.country.trim() : "Ethiopia";

    if (!shippingFullName || !shippingPhone || !shippingAddress || !shippingCity) {
      return res.status(400).json({ success: false, message: "Shipping information is incomplete" });
    }

    let items = parseItems(req.body);
    let fromCart = false;

    if (!items) {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: true },
      });
      items = (cart?.items ?? []).map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      fromCart = true;
    }

    const itemError = validateItems(items);
    if (itemError) {
      return res.status(400).json({ success: false, message: itemError });
    }

    try {
      const order = await prisma.$transaction(async (tx) => {
        // Fetch products and reduce stock atomically.
        const productIds = [...new Set(items.map((item) => item.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });
        const productMap = new Map(products.map((product) => [product.id, product]));

        let subtotal = 0;
        const orderItemsData = [];

        for (const item of items) {
          const product = productMap.get(item.productId);
          if (!product || !product.isActive) {
            const error = new Error(`Product ${item.productId} is unavailable`);
            error.status = 400;
            throw error;
          }
          if (item.quantity > product.stock) {
            const error = new Error(`Insufficient stock for ${product.name}`);
            error.status = 400;
            throw error;
          }

          const updateResult = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
              isActive: true,
            },
            data: { stock: { decrement: item.quantity } },
          });

          if (updateResult.count !== 1) {
            const error = new Error(`Insufficient stock for ${product.name}`);
            error.status = 400;
            throw error;
          }

          const lineSubtotal = Number(product.price) * item.quantity;
          subtotal += lineSubtotal;

          orderItemsData.push({
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            unitPrice: product.price,
            quantity: item.quantity,
            subtotal: lineSubtotal,
          });
        }

        const shippingCost = 0;
        const total = subtotal + shippingCost;

        const created = await tx.order.create({
          data: {
            orderNumber: `ORD-${crypto.randomUUID()}`,
            userId: req.user.id,
            status: "PENDING",
            paymentMethod,
            paymentStatus: "PENDING",
            subtotal,
            shippingCost,
            total,
            shippingFullName,
            shippingPhone,
            shippingEmail,
            shippingAddress,
            shippingCity,
            shippingPostalCode,
            shippingCountry,
            notes,
            items: { create: orderItemsData },
          },
          include: {
            items: { include: { product: true } },
          },
        });

        if (fromCart) {
          const cart = await tx.cart.findUnique({ where: { userId: req.user.id } });
          if (cart) {
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          }
        }

        return created;
      });

      return res.status(201).json({ success: true, data: order });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      console.error("Create order failed:", error);
      return res.status(500).json({ success: false, message: "Unable to create order" });
    }
  });

  // GET /api/orders/my-orders
  router.get("/my-orders", async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
          items: { include: { product: { include: { category: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json({ success: true, data: orders });
    } catch (error) {
      console.error("List own orders failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve orders" });
    }
  });

  // GET /api/orders/:id
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          items: { include: { product: { include: { category: true } } } },
        },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (req.user.role !== "ADMIN" && order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      return res.json({ success: true, data: order });
    } catch (error) {
      console.error("Get order failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve order" });
    }
  });

  return router;
}
