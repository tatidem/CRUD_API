import { IncomingMessage } from 'http';
import { parse } from 'url';
import { ApiError } from '../utils/errors';
import { Message } from '../types/users';
import { isUUID, validateUser } from '../utils/validate';

export async function extractBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    req.on('data', (chunk) => (rawBody += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(new ApiError('Invalid JSON format', 'Bad Request', 400));
      }
    });
    req.on('error', reject);
  });
}

export async function parseIncomingRequest(req: IncomingMessage): Promise<Message> {
  const { pathname } = parse(req.url || '', true);
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const createErrorResponse = (message: string, status: number): Message => ({
    id: requestId,
    code: status,
    action: 'error',
    error: new ApiError(message, status === 404 ? 'Not Found' : 'Bad Request', status),
  });

  if (!pathname?.startsWith('/api/users')) {
    return createErrorResponse('Invalid API endpoint', 404);
  }

  const pathSegments = pathname.split('/').filter(Boolean);
  const userId = pathSegments[2];

  if (pathSegments.length > 3) return createErrorResponse('Invalid endpoint', 404);
  if (pathSegments.length === 3 && !isUUID(userId)) {
    return createErrorResponse('Invalid user ID format', 400);
  }

  try {
    switch (req.method) {
      case 'GET':
        return pathSegments.length === 2
          ? { id: requestId, action: 'get' }
          : { id: requestId, action: 'get', data: [userId] };

      case 'POST': {
        if (userId) return createErrorResponse('Invalid API endpoint', 404);
        const body = await extractBody(req);
        const validationErrors = validateUser(body);
        return validationErrors.length > 0
          ? createErrorResponse(`Validation failed: ${validationErrors.join(', ')}`, 400)
          : { id: requestId, code: 201, action: 'set', data: [body] };
      }

      case 'PUT': {
        const body = await extractBody(req);
        const validationErrors = validateUser(body);
        return validationErrors.length > 0
          ? createErrorResponse(`Validation failed: ${validationErrors.join(', ')}`, 400)
          : { id: requestId, action: 'update', data: [userId, body] };
      }

      case 'DELETE':
        return { id: requestId, code: 204, action: 'delete', data: [userId] };

      default:
        return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    return error instanceof ApiError
      ? createErrorResponse(error.message, error.statusCode)
      : createErrorResponse('Unexpected server error', 500);
  }
}
