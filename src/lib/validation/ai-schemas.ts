import { z } from "zod";

/**
 * Schema for AI generate candidates request validation
 */
export const AiGenerateCandidatesRequestSchema = z.object({
  text: z
    .string()
    .min(1000, "Text must be at least 1000 characters long")
    .max(10000, "Text must not exceed 10000 characters")
    .trim(),
  retry_count: z.number().int().min(0).max(3).optional().default(0),
});

/**
 * Schema for individual AI candidate validation
 */
export const AiCandidateSchema = z.object({
  id: z.string().uuid(),
  front_text: z.string().min(1).max(200),
  back_text: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string(),
});

/**
 * Schema for generation metadata validation
 */
export const GenerationMetadataSchema = z.object({
  model_used: z.string().min(1),
  processing_time_ms: z.number().int().min(0),
  retry_count: z.number().int().min(0).max(3),
});

/**
 * Schema for AI candidates response validation
 */
export const AiGenerateCandidatesResponseSchema = z.object({
  candidates: z.array(AiCandidateSchema).min(1).max(20),
  generation_metadata: GenerationMetadataSchema,
});

/**
 * Utility function to sanitize input text
 */
export function sanitizeInputText(text: string): string {
  return (
    text
      .trim()
      // Remove control characters safely
      .replace(/[\p{Cc}\p{Cf}]/gu, "")
      .replace(/\s+/g, " ") // Normalize whitespace
  ); // Let Zod schema handle length validation
}

/**
 * Validation error formatter for API responses
 */
export function formatValidationErrors(error: z.ZodError): {
  field?: string;
  code: string;
  message: string;
}[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    code: err.code.toUpperCase(),
    message: err.message,
  }));
}
