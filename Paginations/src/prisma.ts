import { PrismaClient } from "@prisma/client";

// 1. Create the client (it reads DATABASE_URL automatically)
const prisma = new PrismaClient();

// 2. Add the global logic to prevent multiple connections in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };

if (process.env.NODE_ENV !== "production") {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
  }
}

export default globalForPrisma.prisma || prisma;
