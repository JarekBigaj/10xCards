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
 * Schema for flashcard list query parameters validation
 */
export const FlashcardListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, "Page must be at least 1")),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")),
  source: z
    .enum(["ai-full", "ai-edit", "manual"], {
      errorMap: () => ({ message: "Source must be one of: ai-full, ai-edit, manual" }),
    })
    .optional(),
  due_before: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "due_before must be a valid ISO timestamp",
    }),
  sort: z
    .enum(["created_at", "due", "difficulty"], {
      errorMap: () => ({ message: "Sort must be one of: created_at, due, difficulty" }),
    })
    .optional(),
  order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "Order must be either asc or desc" }),
    })
    .optional()
    .default("desc"),
});

/**
 * Schema for UUID path parameter validation
 */
export const UuidPathParamSchema = z.object({
  id: z.string().uuid("Invalid flashcard ID format"),
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
export const UpdateFlashcardRequestSchema = z
  .object({
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
  })
  .refine((data) => data.front_text || data.back_text, {
    message: "At least one field (front_text or back_text) must be provided for update",
    path: ["front_text", "back_text"],
  });

/**
 * Schema for multiple flashcards creation request validation
 */
export const CreateFlashcardsRequestSchema = z.object({
  flashcards: z
    .array(CreateFlashcardRequestSchema)
    .min(1, "At least one flashcard is required")
    .max(50, "Cannot create more than 50 flashcards at once"),
});

/**
 * Union schema to handle both single and multiple flashcard creation
 */
export const FlashcardCreationRequestSchema = z.union([CreateFlashcardRequestSchema, CreateFlashcardsRequestSchema]);

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
