import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client.ts";
import bcrypt from "bcrypt";
import readline from "node:readline/promises";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

try {
  const email = "shopora-test@example.com";

  const admin = await prisma.user.findUnique({
    where: { email },
  });

  if (!admin) {
    throw new Error("Admin account not found.");
  }

  if (admin.role !== "ADMIN") {
    throw new Error("This account is not an ADMIN. No changes made.");
  }

  console.log(`Admin account found: ${admin.email}`);
  const password = await rl.question("Enter your new admin password: ");

  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  const confirm = await rl.question("Confirm your new password: ");

  if (password !== confirm) {
    throw new Error("Passwords do not match. No changes made.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log("Admin password successfully updated!");
} catch (error) {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await prisma.$disconnect();
}
