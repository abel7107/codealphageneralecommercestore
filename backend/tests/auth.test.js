
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";

process.env.JWT_SECRET =
  "shopora-test-only-secret-for-automated-tests";

describe("Shopora authentication", () => {
  let app;
  let prisma;
  let passwordHash;
  let testUser;

  beforeEach(async () => {
    passwordHash = await bcrypt.hash("CorrectPass123!", 4);

    testUser = {
      id: 1,
      name: "Test Customer",
      email: "customer@example.com",
      passwordHash,
      role: "CUSTOMER",
      isActive: true,
      createdAt: new Date(),
    };

    prisma = {
      user: {
        create: vi.fn(async ({ data }) => ({
          id: 2,
          name: data.name,
          email: data.email,
          role: data.role,
          createdAt: new Date(),
        })),
        findUnique: vi.fn(async () => testUser),
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
        create: vi.fn(),
      },
    };

    app = createApp(prisma);
  });

  it("registers a new customer with a hashed password", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "New Customer",
        email: "NEW@example.com",
        password: "NewPassword123!",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledOnce();

    const createCall = prisma.user.create.mock.calls[0][0];

    expect(createCall.data.email).toBe("new@example.com");
    expect(createCall.data.role).toBe("CUSTOMER");
    expect(createCall.data.passwordHash).not.toBe("NewPassword123!");

    expect(
      await bcrypt.compare(
        "NewPassword123!",
        createCall.data.passwordHash
      )
    ).toBe(true);
  });

  it("rejects invalid registration details", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "A",
        email: "not-an-email",
        password: "123",
      });

    expect(response.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("logs in with the correct password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "CUSTOMER@example.com",
        password: "CorrectPass123!",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe("customer@example.com");
    expect(response.body.token).toBeTypeOf("string");

    const decoded = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET
    );

    expect(decoded.userId).toBe(testUser.id);
    expect(decoded.role).toBe("CUSTOMER");
  });

  it("rejects an incorrect password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@example.com",
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Invalid email or password"
    );
  });

  it("rejects login for a disabled account", async () => {
    testUser.isActive = false;

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@example.com",
        password: "CorrectPass123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Invalid email or password"
    );
  });
});
