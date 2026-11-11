import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const VALID_RANGES = ["today", "7d", "30d", "month", "year"];

function getRangeStart(range) {
  const now = new Date();
  const start = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (range === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (range === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return start;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

export default function adminAnalyticsRoutes(prisma) {
  const router = Router();
  router.use(authenticateToken, requireAdmin);

  router.get("/overview", async (req, res) => {
    const range = VALID_RANGES.includes(req.query.range) ? req.query.range : "30d";
    const now = new Date();
    const rangeStart = getRangeStart(range);

    try {
      const [
        totalRevenueAgg,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        completedOrders,
        lowStockProducts,
        rangeOrders,
        monthlyOrders,
        recentOrders,
      ] = await Promise.all([
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: { not: "CANCELLED" } },
        }),
        prisma.order.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
        prisma.product.count({ where: { isActive: true, stock: { lt: 5 } } }),
        prisma.order.findMany({
          where: {
            createdAt: { gte: rangeStart, lte: now },
            status: { not: "CANCELLED" },
          },
          include: {
            items: {
              include: {
                product: { include: { category: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.order.findMany({
          where: {
            createdAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
            status: { not: "CANCELLED" },
          },
          select: { createdAt: true, total: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: true,
          },
        }),
      ]);

      // Daily revenue/orders for the selected range.
      const dailyMap = new Map();
      const cursor = new Date(rangeStart);
      while (cursor <= now) {
        dailyMap.set(dateKey(cursor), { date: dateKey(cursor), revenue: 0, orders: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      for (const order of rangeOrders) {
        const key = dateKey(order.createdAt);
        const entry = dailyMap.get(key);
        if (entry) {
          entry.revenue += Number(order.total);
          entry.orders += 1;
        }
      }

      // Monthly revenue for the last 12 months.
      const monthlyMap = new Map();
      for (let i = 11; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyMap.set(monthKey(d), { month: monthKey(d), revenue: 0 });
      }

      for (const order of monthlyOrders) {
        const key = monthKey(order.createdAt);
        const entry = monthlyMap.get(key);
        if (entry) {
          entry.revenue += Number(order.total);
        }
      }

      // Best-selling products in the selected range.
      const productMap = new Map();
      for (const order of rangeOrders) {
        for (const item of order.items) {
          const key = item.productId;
          const current = productMap.get(key) || {
            productId: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
          current.quantity += item.quantity;
          current.revenue += Number(item.subtotal);
          productMap.set(key, current);
        }
      }
      const bestSellingProducts = [...productMap.values()]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Top-selling categories in the selected range.
      const categoryMap = new Map();
      for (const order of rangeOrders) {
        for (const item of order.items) {
          const category = item.product?.category;
          if (!category) continue;
          const key = category.id;
          const current = categoryMap.get(key) || {
            categoryId: category.id,
            name: category.name,
            quantity: 0,
            revenue: 0,
          };
          current.quantity += item.quantity;
          current.revenue += Number(item.subtotal);
          categoryMap.set(key, current);
        }
      }
      const topCategories = [...categoryMap.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return res.json({
        success: true,
        data: {
          range,
          summary: {
            totalRevenue: totalRevenueAgg._sum.total ?? 0,
            totalOrders,
            totalCustomers,
            totalProducts,
            pendingOrders,
            completedOrders,
            lowStockProducts,
          },
          dailyRevenue: [...dailyMap.values()],
          monthlyRevenue: [...monthlyMap.values()],
          bestSellingProducts,
          topCategories,
          recentOrders: recentOrders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customer: order.user?.name || "Unknown",
            total: order.total,
            status: order.status,
            itemCount: order.items.length,
            createdAt: order.createdAt,
          })),
        },
      });
    } catch (error) {
      console.error("Analytics overview failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve analytics" });
    }
  });

  return router;
}
