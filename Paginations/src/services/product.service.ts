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

export const getProductsCursor = async (limit: number, cursor?: number) => {
  // Fetch one extra item to check if there is a next page
  const items = await prisma.product.findMany({
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      id: "asc",
    },
  });

  let nextCursor: number | undefined = undefined;

  // if next page items exist
  if (items.length > limit) {
    // removing extra item
    const nextItem = items.pop();
    // giving last item id
    nextCursor = items[items.length - 1].id;
  }

  return {
    data: items,
    meta: {
      nextCursor,
      // boolean
      hasNextPage: nextCursor !== undefined,
    },
  };
};
