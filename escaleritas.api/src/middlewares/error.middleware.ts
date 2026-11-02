import { Request, Response, NextFunction } from 'express';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: string[];

  constructor(message: string, statusCode = 400, details?: string[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      status: 'error',
      error: err.message,
      details: err.details || [err.message],
    });
    return;
  }

  if (err instanceof UniqueConstraintError) {
    const messages = err.errors.map((e) => e.message);
    res.status(409).json({
      ok: false,
      status: 'error',
      error: messages[0] || 'Conflicto de duplicidad en la base de datos',
      details: messages,
    });
    return;
  }

  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => e.message);
    res.status(422).json({
      ok: false,
      status: 'error',
      error: messages.join(', ') || 'Error de validación de datos',
      details: messages,
    });
    return;
  }

  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      ok: false,
      status: 'error',
      error: 'La sesión ha expirado, por favor inicie sesión nuevamente',
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      ok: false,
      status: 'error',
      error: 'Token de autenticación inválido',
    });
    return;
  }

  const fallbackMessage =
    err instanceof Error ? err.message : 'Error interno del servidor';
  console.error('[ErrorHandler]', err);

  res.status(500).json({
    ok: false,
    status: 'error',
    error: fallbackMessage,
  });
};

