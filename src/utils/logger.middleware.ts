import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

const logger = new Logger('HTTP');

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { method, originalUrl } = req;
  const start = Date.now();

  res.on('finish', () => {
    const delay = Date.now() - start;
    const { statusCode } = res;
    logger.log(`${method} ${originalUrl} ${statusCode} - ${delay}ms`);
  });

  next();
}
