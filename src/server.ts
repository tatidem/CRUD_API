import { createServer, IncomingMessage, ServerResponse } from 'http';
import * as http from 'http';
import { Message } from './types/users';
import { ApiError } from './utils/errors';
import { extractBody, parseIncomingRequest } from './routes/routes';

export class Server {
  readonly instance!: ReturnType<typeof createServer>;
  private readonly workerId: number;
  private readonly pendingRequests?: Map<string, (msg: Message) => void>;
  private readonly dbPort: number;
  private readonly isCluster: boolean;

  constructor(
    public port: number,
    private readonly isClusterWorker: boolean,
    dbPort: number,
  ) {
    this.instance = createServer(this.processRequest.bind(this));
    this.workerId = parseInt(process.env.WORKER_ID || '1', 10);
    this.isCluster = !!process.env.IS_CLUSTER;
    this.dbPort = dbPort;

    if (this.isClusterWorker) {
      this.pendingRequests = new Map();
      process.on('message', (msg: Message) => {
        const callback = this.pendingRequests?.get(msg.id);
        if (callback) {
          callback(msg);
          this.pendingRequests?.delete(msg.id);
        }
      });
    }
  }

  private async processRequest(req: IncomingMessage, res: ServerResponse) {
    console.log(
      `Processing ${req.method} ${req.url} request ${this.isCluster ? `on worker ${this.workerId} (${this.port})` : ''}`,
    );

    const requestData = await parseIncomingRequest(req);

    const finishResponse = (msg: Message) => {
      res.writeHead(msg.error ? msg.error.statusCode : (msg.code ?? 200), {
        'Content-Type': 'application/json',
      });
      res.end(msg.error ? JSON.stringify(msg.error) : JSON.stringify(msg.data || {}));
    };

    if (requestData.error) {
      res.writeHead(requestData.error.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(requestData.error));
    } else {
      this.forwardDbRequest(requestData, finishResponse);
    }
  }

  private forwardDbRequest(message: Message, callback: (msg: Message) => void): void {
    const requestOptions = {
      hostname: 'localhost',
      port: this.dbPort,
      path: '/db',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(message)),
      },
    };

    const handleError = (err: unknown) => {
      const error =
        err instanceof ApiError
          ? err
          : new ApiError('Database connection failed', 'Internal Error', 500);
      callback({
        id: message.id,
        action: 'error',
        code: 500,
        error,
      });
    };

    const dbRequest = http.request(requestOptions, (response) => {
      extractBody<Message>(response).then(callback).catch(handleError);
    });

    dbRequest.on('error', (err) => {
      console.error('Database request failed:', err);
      handleError(err);
    });

    dbRequest.write(JSON.stringify(message));
    dbRequest.end();
  }

  public start(): void {
    this.instance.listen(this.port, () => {
      console.log(`${this.isCluster ? 'Worker' : 'Server'} started on port ${this.port}`);
      if (this.isClusterWorker) process.send?.('ready');
    });
  }
}
