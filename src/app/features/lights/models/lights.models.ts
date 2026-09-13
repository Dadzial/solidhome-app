export interface Light {
  id: string;
  x: number;
  y: number;
  on: boolean;
}

export interface LightItem {
  _id?: string;
  name: string;
  state: 0 | 1;
  updatedAt?: string;
}

export interface LightHistoryItem {
  _id: string;
  name: string;
  state: 0 | 1;
  createdAt: string;
  userId?: {
    _id: string;
    userName: string;
    email: string;
  } | null;
}

export interface ResetHistoryResponse {
  message: string;
  deletedCount?: number;
}

export interface LightHistory {
  id: string;
  name: string;
  action: 'ON' | 'OFF';
  time: string;
  user: string;
}
