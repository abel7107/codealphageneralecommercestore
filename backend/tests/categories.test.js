
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET =
  "shopora-test-only-secret-for-automated-tests";

describe("Shopora category security", () => {
  let app;
  let prisma;

  function makeToken(role) {
    return jwt.sign(
      { userId: 1, role },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "5m" }
    );
  }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      product: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      category: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({
          id: 1,
          name: "Electronics",
          createdAt: new Date(),
        }),
      },
    };

    app = createApp(prisma);
  });

  it("allows the public to view categories", async () => {
    const response = await request(app).get("/api/categories");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(prisma.category.findMany).toHaveBeenCalledOnce();
  });

  it("rejects category creation without a token", async () => {
    const response = await request(app)
      .post("/api/categories")
      .send({ name: "Electronics" });

    expect(response.status).toBe(401);
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it("rejects category creation by a customer", async () => {
    const token = makeToken("CUSTOMER");

    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Electronics" });

    expect(response.status).toBe(403);
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it("allows an admin to create a category", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Electronics" });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Electronics");
    expect(prisma.category.create).toHaveBeenCalledOnce();
  });

  it("rejects a duplicate category name", async () => {
    const token = makeToken("ADMIN");

    prisma.category.create.mockRejectedValue({
      code: "P2002",
    });

    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Electronics" });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "This category already exists"
    );
  });

  it("rejects an empty category name", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "   " });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Category name is required");
    expect(prisma.category.create).not.toHaveBeenCalled();
  });
});
