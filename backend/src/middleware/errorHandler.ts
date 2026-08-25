import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        type: err.name,
        message: err.message,
        details: err.details || null,
      },
    });
  }

  console.error('Unhandled server error:', err);

  return res.status(500).json({
    success: false,
    error: {
      type: 'InternalServerError',
      message: 'An unexpected server error occurred.',
      details: process.env.NODE_ENV === 'development' ? err.message : null,
    },
  });
};
