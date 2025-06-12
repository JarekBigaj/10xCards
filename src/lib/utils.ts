import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ErrorResponse, ApiError, ApiErrorCode } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates standardized API error responses
 */
export function createErrorResponse(
  error: string,
  statusCode: number = 500,
  details?: ApiError[]
): { response: Response; statusCode: number } {
  const errorResponse: ErrorResponse = {
    success: false,
    error,
    ...(details && { details }),
  };

  return {
    response: new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    }),
    statusCode,
  };
}

/**
 * Creates standardized validation error response
 */
export function createValidationErrorResponse(
  message: string = "Validation failed",
  details: ApiError[]
): { response: Response; statusCode: number } {
  return createErrorResponse(message, 400, details);
}

/**
 * Creates standardized authentication error response
 */
export function createAuthErrorResponse(): { response: Response; statusCode: number } {
  return createErrorResponse("Authentication required", 401);
}

/**
 * Creates standardized not found error response
 */
export function createNotFoundErrorResponse(resource: string = "Resource"): { response: Response; statusCode: number } {
  return createErrorResponse(`${resource} not found or access denied`, 404);
}

/**
 * Creates standardized duplicate error response
 */
export function createDuplicateErrorResponse(
  field: string,
  message: string = "Duplicate entry"
): { response: Response; statusCode: number } {
  const details: ApiError[] = [
    {
      field,
      code: "DUPLICATE" as ApiErrorCode,
      message,
    },
  ];

  return createErrorResponse("Duplicate entry found", 409, details);
}

/**
 * Creates standardized server error response
 */
export function createServerErrorResponse(message: string = "Internal server error"): {
  response: Response;
  statusCode: number;
} {
  return createErrorResponse(message, 500);
}

/**
 * Handles common service errors and maps them to appropriate HTTP responses
 */
export function handleServiceError(error: Error): { response: Response; statusCode: number } {
  const message = error.message;

  switch (message) {
    case "NOT_FOUND":
      return createNotFoundErrorResponse("Flashcard");

    case "DUPLICATE":
      return createDuplicateErrorResponse("front_text", "Another flashcard with identical front text exists");

    default:
      // Log unexpected errors for debugging
      console.error("Unhandled service error:", error);

      // Check for database-related errors
      if (
        message.includes("Failed to update") ||
        message.includes("Failed to fetch") ||
        message.includes("Database error")
      ) {
        return createServerErrorResponse("Database error occurred");
      }

      return createServerErrorResponse(message);
  }
}
