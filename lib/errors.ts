export class InsufficientStockError extends Error {
  constructor(message = 'Insufficient stock available') {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

export class ReservationExpiredError extends Error {
  constructor(message = 'Reservation has expired') {
    super(message);
    this.name = 'ReservationExpiredError';
  }
}

export class ConcurrencyConflictError extends Error {
  constructor(message = 'A concurrency conflict occurred. Please retry.') {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends Error {
  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'BadRequestError';
  }
}
