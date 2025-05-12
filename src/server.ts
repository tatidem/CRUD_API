import 'dotenv/config';
import cluster from 'cluster';
import os from 'os';
import app from './app';

const PORT = parseInt(process.env.PORT || '4000');
const numCPUs = os.availableParallelism ? os.availableParallelism() : os.cpus().length;

if (process.argv[2] === 'multi' && cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);


  for (let i = 0; i < numCPUs - 1; i++) {
    const workerPort = PORT + i + 1;
    cluster.fork({ WORKER_PORT: workerPort.toString() });
  }

  cluster.on('exit', (worker) => {
    console.log(`worker ${worker.process.pid} died`);
    const workerPort = PORT + (cluster.workers ? Object.keys(cluster.workers).length : 0) + 1;
    cluster.fork({ WORKER_PORT: workerPort.toString() });
  });

  // Load balancer
  app.listen(PORT, () => {
    console.log(`Load balancer running on port ${PORT}`);
  });

  let currentWorker = 0;
  app.use((req, res, next) => {
    if (!req.url.startsWith('/api')) return next();

    const workers = cluster.workers ? Object.values(cluster.workers) : [];
    if (workers.length === 0) return next();

    const worker = workers[currentWorker % workers.length];
    currentWorker++;

    const workerPort = process.env.WORKER_PORT || (PORT + 1).toString();
    const targetUrl = `http://localhost:${workerPort}${req.url}`;

    console.log(`Proxying request to worker ${worker?.process.pid} at ${targetUrl}`);
    
    fetch(targetUrl, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })
      .then((response) => response.json())
      .then((data) => res.json(data))
      .catch((err) => res.status(500).json({ message: 'Error proxying request' }));
  });
} else {
  const workerPort = process.env.WORKER_PORT || PORT.toString();
  app.listen(parseInt(workerPort), () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${workerPort}`);
  });
}