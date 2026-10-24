import rateLimit from "express-rate-limit";
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/authMiddleware.js";

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many authentication attempts. Please try again later.",
    },
  });
export default function authRoutes(prisma) {
  const router = Router();

  function createToken(user) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "1h",
      }
    );
  }

  // POST /api/auth/register
 router.post("/register", authLimiter, async (req, res) => {
    const name =
      typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password = req.body?.password;

    if (
      name.length < 2 ||
      name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      typeof password !== "string" ||
      Buffer.byteLength(password, "utf8") < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid name, email, and password of 8–72 UTF-8 bytes.",
      });
    }

    try {
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "CUSTOMER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: user,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          message: "An account with that email already exists",
        });
      }

      console.error("Registration failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to register account",
      });
    }
  });

  // POST /api/auth/login
  router.post("/login", authLimiter, async (req, res) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password = req.body?.password;

    if (
      !email ||
      typeof password !== "string" ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email and password are required",
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Use the same message for unknown emails and incorrect passwords.
      const passwordMatches = user
        ? await bcrypt.compare(password, user.passwordHash)
        : false;

      if (!user || !passwordMatches || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = createToken(user);

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to log in",
      });
    }
  });

  // GET /api/auth/me
  router.get("/me", authenticateToken, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is unavailable",
        });
      }

      return res.json({ success: true, data: user });
    } catch (error) {
      console.error("Fetch current user failed:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to retrieve account",
      });
    }
  });

  return router;
}
