
export interface LoginRequest {
  userName: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  email: string;
  userName: string;
  password: string;
}

export interface RegisterResponse {
  _id: string;
  email: string;
  userName: string;
}

export interface VerifyEmailRequest {
  email: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ConfirmPasswordRequest {
  code: string;
  password: string;
}

export interface ConfirmPasswordResponse {
  message: string;
}
