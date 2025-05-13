import { DbUser, Message } from '../types/users';
import { ApiError } from '../utils/errors';
import { Database } from './database';

export function executeDbCommand(cmd: Message, db: Database): Message {
  try {
    let result: unknown;
    const data = cmd.data as [string | DbUser, DbUser];

    switch (cmd.action) {
      case 'get':
        result = db.get(data?.[0] as string);
        break;

      case 'set':
        result = db.set(data?.[0] as DbUser);
        break;

      case 'update':
        result = db.update(data?.[0] as string, data?.[1]);
        break;

      case 'delete':
        result = db.delete(data?.[0] as string);
        break;

      default:
        console.log(cmd.action);
        throw new ApiError('Invalid operation', 'Bad Request', 400);
    }

    if (result instanceof ApiError) throw result;
    return { ...cmd, data: result };
  } catch (error) {
    console.log(error);
    return {
      ...cmd,
      code: error instanceof ApiError ? error.statusCode : 500,
      error: error instanceof ApiError ? error : new ApiError('Operation failed', 'Internal', 500),
    };
  }
}
