import { z } from "zod";
import type { ApiError, ApiErrorCode } from "../../types";

/**
 * Schema for checking flashcard duplicates request validation
 */
export const CheckDuplicateRequestSchema = z.object({
  front_text: z.string().min(1, "Front text is required").max(200, "Front text must not exceed 200 characters").trim(),
  back_text: z.string().max(500, "Back text must not exceed 500 characters").trim().optional(),
  user_id: z.string().uuid("Invalid user ID format").optional(),
});

/**
 * Schema for flashcard creation request validation
 */
export const CreateFlashcardRequestSchema = z.object({
  front_text: z.string().min(1, "Front text is required").max(200, "Front text must not exceed 200 characters").trim(),
  back_text: z.string().min(1, "Back text is required").max(500, "Back text must not exceed 500 characters").trim(),
  source: z.enum(["ai-full", "ai-edit", "manual"], {
    errorMap: () => ({ message: "Source must be one of: ai-full, ai-edit, manual" }),
  }),
  candidate_id: z.string().uuid().optional(),
});

/**
 * Schema for flashcard update request validation
 */
export const UpdateFlashcardRequestSchema = z.object({
  front_text: z
    .string()
    .min(1, "Front text cannot be empty")
    .max(200, "Front text must not exceed 200 characters")
    .trim()
    .optional(),
  back_text: z
    .string()
    .min(1, "Back text cannot be empty")
    .max(500, "Back text must not exceed 500 characters")
    .trim()
    .optional(),
  source: z.enum(["ai-edit", "manual"], {
    errorMap: () => ({ message: "Source must be either ai-edit or manual for updates" }),
  }),
});

/**
 * Utility function to normalize text for comparison
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[^\w\s]/g, ""); // Remove punctuation for better comparison
}

/**
 * Validation error formatter for flashcard API responses
 */
export function formatFlashcardValidationErrors(error: z.ZodError): ApiError[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    code: "VALIDATION_ERROR" as ApiErrorCode,
    message: err.message,
  }));
}
