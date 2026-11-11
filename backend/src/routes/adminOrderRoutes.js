import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const ORDER_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const VALID_STATUSES = Object.keys(ORDER_TRANSITIONS);
const VALID_PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export default function adminOrderRoutes(prisma) {
  const router = Router();
  router.use(authenticateToken, requireAdmin);

  // GET /api/admin/orders/stats
  router.get("/stats", async (req, res) => {
    try {
      const [totalOrders, pending, confirmed, processing, shipped, delivered, cancelled, revenueAgg] =
        await Promise.all([
          prisma.order.count(),
          prisma.order.count({ where: { status: "PENDING" } }),
          prisma.order.count({ where: { status: "CONFIRMED" } }),
          prisma.order.count({ where: { status: "PROCESSING" } }),
          prisma.order.count({ where: { status: "SHIPPED" } }),
          prisma.order.count({ where: { status: "DELIVERED" } }),
          prisma.order.count({ where: { status: "CANCELLED" } }),
          prisma.order.aggregate({
            _sum: { total: true },
            where: { status: { not: "CANCELLED" } },
          }),
        ]);

      return res.json({
        success: true,
        data: {
          totalOrders,
          byStatus: {
            PENDING: pending,
            CONFIRMED: confirmed,
            PROCESSING: processing,
            SHIPPED: shipped,
            DELIVERED: delivered,
            CANCELLED: cancelled,
          },
          revenue: revenueAgg._sum.total ?? 0,
        },
      });
    } catch (error) {
      console.error("Order stats failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve order stats" });
    }
  });

  // GET /api/admin/orders
  router.get("/", async (req, res) => {
    const status = req.query.status;
    const userId = req.query.userId === undefined ? undefined : Number(req.query.userId);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }
    if (userId !== undefined && (!Number.isSafeInteger(userId) || userId < 1)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "Invalid pagination parameters" });
    }

    const where = {
      ...(status ? { status } : {}),
      ...(userId !== undefined ? { userId } : {}),
    };

    try {
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            items: { include: { product: { include: { category: true } } } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      return res.json({
        success: true,
        data: orders,
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
      console.error("List admin orders failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve orders" });
    }
  });

  // GET /api/admin/orders/:id
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

      return res.json({ success: true, data: order });
    } catch (error) {
      console.error("Get admin order failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve order" });
    }
  });

  // PATCH /api/admin/orders/:id/status
  router.patch("/:id/status", async (req, res) => {
    const id = Number(req.params.id);
    const status = req.body?.status;
    const paymentStatus = req.body?.paymentStatus;

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }
    if (paymentStatus !== undefined && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!existing) {
          const error = new Error("Order not found");
          error.status = 404;
          throw error;
        }

        if (!ORDER_TRANSITIONS[existing.status].includes(status)) {
          const error = new Error(`Cannot transition from ${existing.status} to ${status}`);
          error.status = 400;
          throw error;
        }

        // Restore stock when cancelling an eligible order.
        if (status === "CANCELLED" && existing.status !== "CANCELLED") {
          for (const item of existing.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        return tx.order.update({
          where: { id },
          data: {
            status,
            ...(paymentStatus !== undefined ? { paymentStatus } : {}),
          },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            items: { include: { product: { include: { category: true } } } },
          },
        });
      });

      return res.json({ success: true, data: updated });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      if (error.code === "P2025") {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      console.error("Update order status failed:", error);
      return res.status(500).json({ success: false, message: "Unable to update order" });
    }
  });

  return router;
}
