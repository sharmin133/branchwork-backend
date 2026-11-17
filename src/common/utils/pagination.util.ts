
export function createPaginationResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}
