import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

export default function settingsRoutes(prisma) {
  const router = Router();
  router.use(authenticateToken, requireAdmin);

  router.get("/", async (req, res) => {
    try {
      const settings = await prisma.storeSetting.upsert({
        where: { id: 1 },
        create: {},
        update: {},
      });
      return res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Get settings failed:", error);
      return res.status(500).json({ success: false, message: "Unable to retrieve settings" });
    }
  });

  router.put("/", async (req, res) => {
    const storeName = typeof req.body?.storeName === "string" ? req.body.storeName.trim() : undefined;
    const storeDescription = typeof req.body?.storeDescription === "string" ? req.body.storeDescription.trim() : (req.body?.storeDescription === null ? null : undefined);
    const contactEmail = typeof req.body?.contactEmail === "string" ? req.body.contactEmail.trim() : (req.body?.contactEmail === null ? null : undefined);
    const contactPhone = typeof req.body?.contactPhone === "string" ? req.body.contactPhone.trim() : (req.body?.contactPhone === null ? null : undefined);
    const currency = typeof req.body?.currency === "string" ? req.body.currency.trim() : undefined;
    const shippingFee = req.body?.shippingFee;

    if (storeName !== undefined && !storeName) {
      return res.status(400).json({ success: false, message: "Store name is required" });
    }
    if (currency !== undefined && !currency) {
      return res.status(400).json({ success: false, message: "Currency is required" });
    }
    if (shippingFee !== undefined && (!Number.isFinite(Number(shippingFee)) || Number(shippingFee) < 0)) {
      return res.status(400).json({ success: false, message: "Invalid shipping fee" });
    }

    const data = {};
    if (storeName !== undefined) data.storeName = storeName;
    if (storeDescription !== undefined) data.storeDescription = storeDescription;
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;
    if (currency !== undefined) data.currency = currency;
    if (shippingFee !== undefined) data.shippingFee = Number(shippingFee);

    try {
      const settings = await prisma.storeSetting.upsert({
        where: { id: 1 },
        create: { storeName: storeName || "Shopora", ...data },
        update: data,
      });
      return res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Update settings failed:", error);
      return res.status(500).json({ success: false, message: "Unable to update settings" });
    }
  });

  return router;
}
