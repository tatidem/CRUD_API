import { DbUser, User } from '../types/users';
import { ApiError } from '../utils/errors';
import { randomUUID } from 'crypto';

export class Database {
  private readonly storage: Map<string, DbUser> = new Map();

  get(id?: string): User | User[] | ApiError {
    if (!id) {
      return Array.from(this.storage.keys())
        .map((uuid) => this.get(uuid))
        .filter((user): user is User => !(user instanceof ApiError));
    } else {
      const user = this.storage.get(id);
      if (user) return { id, ...user };
      return this.errorNotFound(id);
    }
  }

  set(dbUser: DbUser): User {
    const id = randomUUID();
    this.storage.set(id, dbUser);
    return { id, ...dbUser };
  }

  update(id: string, dbUser: DbUser): User | ApiError {
    const user = this.storage.get(id);
    if (user) {
      this.storage.set(id, dbUser);
      return { id, ...dbUser };
    }
    return this.errorNotFound(id);
  }

  delete(id: string): boolean | ApiError {
    const user = this.storage.get(id);
    this.storage.delete(id);
    return user ? true : this.errorNotFound(id);
  }

  private errorNotFound(id: string): ApiError {
    return new ApiError(`User: ${id} doesn't exist`, 'Not Found', 404);
  }

  error(id?: string) {
    if (id) return this.errorNotFound(id);
    return new ApiError('Internal Server Error', 'Internal Server Error', 500);
  }
}
