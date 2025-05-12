import cluster from 'cluster';
import * as http from 'http';
import { cpus } from 'os';
import { launchDatabase } from './database/databaseService';
import { Server } from './server';
import dotenv from 'dotenv';
dotenv.config();

const DB_PORT_OFFSET = 1;
const WORKER_PORT_OFFSET = 2;

async function bootstrap() {
  const clusterMode = process.argv.includes('--multi');
  const basePort = Number(process.env.PORT) || 4000;

  if (clusterMode && cluster.isPrimary) {
    console.log(`Main process (PID: ${process.pid}) started`);

    const cpusCount = cpus().length;
    const cpuCores = cpusCount > 2 ? cpusCount - 2 : 2;
    const workerPorts = Array.from(
      { length: cpuCores },
      (_, i) => basePort + WORKER_PORT_OFFSET + i,
    );

    let readyWorkers = 0;
    let currentWorker = 0;

    await launchDatabase(basePort + DB_PORT_OFFSET);

    for (const [index, port] of workerPorts.entries()) {
      const worker = cluster.fork({
        WORKER_PORT: port,
        IS_CLUSTER: 'true',
        WORKER_ID: index + 1,
        DB_PORT: String(basePort + DB_PORT_OFFSET),
      });

      worker.on('message', (msg: string) => {
        if (msg === 'ready') {
          readyWorkers++;

          if (readyWorkers === workerPorts.length) {
            startLoadBalancer(basePort, workerPorts);
          }
        }
      });
    }

    function startLoadBalancer(mainPort: number, ports: number[]) {
      const balancer = http.createServer((req, res) => {
        const targetPort = ports[currentWorker % ports.length];
        currentWorker++;

        const proxy = http.request(
          {
            host: 'localhost',
            port: targetPort,
            path: req.url,
            method: req.method,
            headers: req.headers,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
          },
        );

        req.pipe(proxy, { end: true });
      });

      balancer.listen(mainPort, () => {
        console.log(`Load balancer running on port ${mainPort}`);
      });
    }
  } else {
    try {
      const workerPort = Number(process.env.WORKER_PORT) || basePort;
      const dbPort = Number(process.env.DB_PORT) || basePort + DB_PORT_OFFSET;

      //if (!clusterMode) await launchDatabase(basePort + DB_PORT_OFFSET);
      new Server(clusterMode ? workerPort : basePort, cluster.isWorker, dbPort).start();
    } catch (err) {
      console.error('Worker failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }
}

bootstrap().catch(console.error);
