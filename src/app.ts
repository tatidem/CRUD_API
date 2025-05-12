import express from 'express';
import usersRouter from './routes/users';
import { errorHandler, notFoundHandler } from './utils/errorHandler';

const app = express();

app.use(express.json());
app.use('/api/users', usersRouter);
app.use('*', notFoundHandler);
app.use(errorHandler);

export default app;