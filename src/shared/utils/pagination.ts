import { z } from "zod";

export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function buildPagination(input: PaginationInput): { limit: number; offset: number } {
  return { limit: input.limit, offset: (input.page - 1) * input.limit };
}

export function paginatedResult<T>(
  data: T[],
  total: number,
  input: PaginationInput,
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page:       input.page,
      limit:      input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}
