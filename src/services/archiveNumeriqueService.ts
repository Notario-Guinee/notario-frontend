// src/services/types.ts

export interface ApiResponse<T> {
  error: boolean;
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  errorDetails?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  numberOfElements: number;
  empty: boolean;
  sort?: SortInfo;
}

export interface SortInfo {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
  orders?: SortOrder[];
}

export interface SortOrder {
  property: string;
  direction: "ASC" | "DESC";
}