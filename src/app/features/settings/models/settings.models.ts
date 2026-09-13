export interface UpdateUserRequest {
  email?: string;
  userName?: string;
  currentPassword?: string;
  password?: string;
}

export interface UpdateUserResponse {
  _id: string;
  userName: string;
}
