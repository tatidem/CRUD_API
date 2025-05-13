import { Database } from '../database/database';
import { ApiError } from '../utils/errors';

export interface DbUser {
  username: string;
  age: number;
  hobbies: string[];
}

export interface User extends DbUser {
  readonly id: string;
}

export interface Message {
  id: string;
  code?: number;
  action: keyof Database;
  data?: unknown;
  error?: ApiError;
}
