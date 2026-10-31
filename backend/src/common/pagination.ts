export interface Pagination {
  page: number;
  limit: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function parsePagination(page?: string, limit?: string): Pagination | undefined {
  if (page === undefined && limit === undefined) return undefined;

  const parsedPage = Number(page ?? 1);
  const parsedLimit = Number(limit ?? 20);

  return {
    page: Number.isFinite(parsedPage) ? Math.max(1, Math.floor(parsedPage)) : 1,
    limit: Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, Math.floor(parsedLimit))) : 20,
  };
}

export interface PaginatableQuery<T> {
  skip(offset: number): PaginatableQuery<T>;
  take(limit: number): PaginatableQuery<T>;
  getManyAndCount(): Promise<[T[], number]>;
}

export async function paginateQuery<T>(
  query: PaginatableQuery<T>,
  pagination: Pagination,
): Promise<Paginated<T>> {
  query.skip((pagination.page - 1) * pagination.limit).take(pagination.limit);
  const [items, total] = await query.getManyAndCount();
  return { items, total, page: pagination.page, limit: pagination.limit };
}
