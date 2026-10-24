
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";

// This is a test-only secret, not your real JWT secret.
process.env.JWT_SECRET = "shopora-test-only-secret-for-automated-tests";

describe("Shopora authorization security", () => {
  let app;
  let prisma;

  function makeToken(role) {
    return jwt.sign(
      { userId: 1, role },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "5m",
      }
    );
  }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      category: {
        findMany: vi.fn(),
        create: vi.fn().mockResolvedValue({
          id: 1,
          name: "Test Category",
          createdAt: new Date(),
        }),
      },
    };

    app = createApp(prisma);
  });

  it("rejects product creation without a token", async () => {
    const response = await request(app)
      .post("/api/products")
      .send({ name: "Test Product" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication required");
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("rejects product creation by a customer", async () => {
    const token = makeToken("CUSTOMER");

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Product" });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Administrator access required"
    );
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("allows an admin to create a category", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Category" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(prisma.category.create).toHaveBeenCalledOnce();
  });
});
