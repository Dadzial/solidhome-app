export interface ApiError {
  error?: string;
  message?: string;
  details?: string | string[];
  value?: string;
}

export interface LogoutResponse {
  message: string;
}
