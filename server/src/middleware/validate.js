import mongoose from 'mongoose';
import { HttpError, notFound } from '../utils/httpError.js';

/** Parses `req[source]` with a zod schema and replaces it with the parsed value, or fails with 400 + per-field messages. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      fields[key] ??= issue.message;
    }
    throw new HttpError(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields', fields);
  }
  // Express 5 makes req.query a getter, so parsed values go on req.valid instead of overwriting it.
  req.valid = { ...req.valid, [source]: result.data };
  next();
};

/** A malformed id can't belong to the user, so it is answered like any other missing resource. */
export const validId = (param, what) => (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) throw notFound(what);
  next();
};
