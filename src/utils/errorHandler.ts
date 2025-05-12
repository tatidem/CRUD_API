import { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: 'Endpoint not found' });
};