// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// 搜索结果类型
export interface SearchResult {
  id: number;
  name: string;
  url: string;
  description: string;
  icon: string | null;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
}

// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应类型
export interface LoginResponse {
  token: string;
}

// 设置类型
export interface Setting {
  key: string;
  value: string;
}

// 分页参数类型
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
