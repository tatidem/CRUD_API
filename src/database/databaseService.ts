import * as http from 'node:http';
import { Database } from './database';
import { Message } from '../types/users';
import { ApiError } from '../utils/errors';
import { extractBody } from '../routes/routes';
import { executeDbCommand } from './commandHandler';

export async function launchDatabase(port: number): Promise<void> {
  const dbInstance = new Database();

  const requestHandler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.method === 'POST' && req.url === '/db') {
      try {
        const command = await extractBody<Message>(req);
        const response = executeDbCommand(command, dbInstance);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (err) {
        const error =
          err instanceof ApiError ? err : new ApiError('Database error', 'Internal', 500);
        res.writeHead(error.statusCode).end(JSON.stringify(error));
      }
    } else {
      res.writeHead(404).end();
    }
  };

  return new Promise((resolve, reject) => {
    const service = http.createServer(requestHandler);
    service.listen(port, () => {
      console.log(`Database service active on port ${port}`);
      resolve();
    });
    service.on('error', reject);
  });
}
