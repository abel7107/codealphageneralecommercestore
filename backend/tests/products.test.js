
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET =
  "shopora-test-only-secret-for-automated-tests";

describe("Shopora product API", () => {
  let app;
  let prisma;

  const sampleProduct = {
    id: 1,
    name: "Wireless Mouse",
    slug: "wireless-mouse",
    description: "A test product",
    price: 25.99,
    stock: 10,
    categoryId: 1,
    isActive: true,
    category: { id: 1, name: "Electronics" },
  };

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
        findMany: vi.fn().mockResolvedValue([sampleProduct]),
        count: vi.fn().mockResolvedValue(1),
        findUnique: vi.fn(),
        create: vi.fn().mockResolvedValue(sampleProduct),
        update: vi.fn().mockResolvedValue(sampleProduct),
        delete: vi.fn().mockResolvedValue(sampleProduct),
      },
      category: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
      },
    };

    app = createApp(prisma);
  });

  it("allows the public to list active products", async () => {
    const response = await request(app)
      .get("/api/products");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(prisma.product.findMany).toHaveBeenCalledOnce();
    expect(prisma.product.count).toHaveBeenCalledOnce();
  });

  it("rejects invalid pagination parameters", async () => {
    const response = await request(app)
      .get("/api/products?page=0");

    expect(response.status).toBe(400);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("rejects product creation with a negative price", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Wireless Mouse",
        slug: "wireless-mouse",
        price: -10,
        stock: 5,
        categoryId: 1,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid product fields");
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("rejects product creation with negative stock", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Wireless Mouse",
        slug: "wireless-mouse",
        price: 25.99,
        stock: -1,
        categoryId: 1,
      });

    expect(response.status).toBe(400);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("allows an admin to create a valid product", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Wireless Mouse",
        slug: "wireless-mouse",
        price: 25.99,
        stock: 10,
        categoryId: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(prisma.product.create).toHaveBeenCalledOnce();

    const createCall = prisma.product.create.mock.calls[0][0];
    expect(createCall.data.name).toBe("Wireless Mouse");
    expect(createCall.data.price).toBe(25.99);
    expect(createCall.data.stock).toBe(10);
  });

  it("prevents a customer from updating a product", async () => {
    const token = makeToken("CUSTOMER");

    const response = await request(app)
      .put("/api/products/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 20 });

    expect(response.status).toBe(403);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("prevents a customer from deleting a product", async () => {
    const token = makeToken("CUSTOMER");

    const response = await request(app)
      .delete("/api/products/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });

  
  it("rejects product creation when required fields are missing", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("rejects malformed product IDs on update", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .put("/api/products/abc")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Mouse" });

    expect(response.status).toBe(400);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("rejects zero price on update", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .put("/api/products/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 0 });

    expect(response.status).toBe(400);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("rejects negative stock on update", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .put("/api/products/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ stock: -5 });

    expect(response.status).toBe(400);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid category ID when creating a product", async () => {
    const token = makeToken("ADMIN");

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Product",
        slug: "test-product",
        price: 25.99,
        categoryId: 0,
      });

    expect(response.status).toBe(400);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });
});
