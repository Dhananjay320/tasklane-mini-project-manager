/** An error with an HTTP status that the error handler turns into `{ error: { code, message, fields? } }`. */
export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, 'NOT_FOUND', `${what} not found`);
