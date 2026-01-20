import prisma from "./prisma";

export const findUserById = async (id: number) => {
  // Only generic DB logic here
  return await prisma.user.findUnique({ where: { id } });
};
