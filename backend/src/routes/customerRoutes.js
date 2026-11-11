import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

export default function customerRoutes(prisma) {
  const router = Router();
  router.use(authenticateToken, requireAdmin);

  // GET /api/admin/customers
  router.get("/", async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = req.query.status; // "active" or "disabled"
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (status !== undefined && !["active", "disabled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid customer status" });
    }
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "Invalid pagination parameters" });
    }

    const where = {
      role: "CUSTOMER",
      ...(status === "active" ? { isActive: true } : {}),
      ...(status === "disabled" ? { isActive: false } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    try {
      const [customers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      const ids = customers.map((customer) => customer.id);
      const spending = ids.length
        ? await prisma.order.groupBy({
            by: ["userId"],
            where: { userId: { in: ids }, status: { not: "CANCELLED" } },
            _sum: { total: true },
          })
        : [];
      const spendingMap = new Map(spending.map((item) => [item.userId, item._sum.total ?? 0]));

      const data = customers.map((customer) => ({
        ...customer,
        totalSpending: spendingMap.get(customer.id) ?? 0,
      }));

      return res.json({
        success: true,
        data,
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
      console.error("List customers failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve customers" });
    }
  });

  // GET /api/admin/customers/:id
  router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    try {
      const customer = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { orders: true } },
        },
      });

      if (!customer || customer.role !== "CUSTOMER") {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      const [spendingAgg, latestOrder] = await Promise.all([
        prisma.order.aggregate({
          where: { userId: id, status: { not: "CANCELLED" } },
          _sum: { total: true },
        }),
        prisma.order.findFirst({
          where: { userId: id },
          orderBy: { createdAt: "desc" },
          select: { shippingPhone: true, shippingEmail: true },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          ...customer,
          totalSpending: spendingAgg._sum.total ?? 0,
          phone: latestOrder?.shippingPhone || null,
          contactEmail: latestOrder?.shippingEmail || customer.email,
        },
      });
    } catch (error) {
      console.error("Get customer failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve customer" });
    }
  });

  // GET /api/admin/customers/:id/orders
  router.get("/:id/orders", async (req, res) => {
    const id = Number(req.params.id);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: "Invalid pagination parameters" });
    }

    try {
      const customer = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true },
      });

      if (!customer || customer.role !== "CUSTOMER") {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { userId: id },
          include: {
            items: { include: { product: { include: { category: true } } } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.order.count({ where: { userId: id } }),
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
      console.error("List customer orders failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve customer orders" });
    }
  });

  return router;
}
