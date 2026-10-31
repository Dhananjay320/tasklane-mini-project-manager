import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { ApiErrorBody } from "./types";

type QueryError = FetchBaseQueryError | SerializedError | undefined;

function body(error: QueryError): ApiErrorBody["error"] | undefined {
  if (error && "status" in error && error.data && typeof error.data === "object" && "error" in error.data) {
    return (error.data as ApiErrorBody).error;
  }
  return undefined;
}

/** A sentence to show the user for any failed API call. */
export function errorMessage(error: QueryError, fallback = "Something went wrong. Please try again"): string {
  if (error && "status" in error && error.status === "FETCH_ERROR") return "Can't reach the server. Check your connection";
  return body(error)?.message ?? fallback;
}

/** Per-field validation messages from a 400 / 409 response. */
export function fieldErrors(error: QueryError): Record<string, string> {
  return body(error)?.fields ?? {};
}

export function errorStatus(error: QueryError): number | string | undefined {
  return error && "status" in error ? error.status : undefined;
}
