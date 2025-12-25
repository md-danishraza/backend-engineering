import prisma from "../prisma.js";

export const getPaginatedProducts = async (page: number, limit: number) => {
  // 1. Calculate how many items to skip
  const skip = (page - 1) * limit;

  // 2. Fetch Data and Total Count in parallel
  // using transactions - set of queries
  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: "desc", // Show newest items first
      },
    }),
    prisma.product.count(), // Get total number of products
  ]);

  // 3. Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // 4. Return standard structure
  return {
    data,
    meta: {
      totalItems: total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    },
  };
};
