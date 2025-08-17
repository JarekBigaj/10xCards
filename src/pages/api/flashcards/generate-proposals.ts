import type { APIRoute } from "astro";
import type { FlashcardGenerationRequest, GeneratedFlashcard, ApiResponse, ErrorResponse } from "../../../types";

import { FlashcardService } from "../../../lib/services/flashcard.service";
import { rateLimiter } from "../../../lib/services/rate-limiter";
import { z } from "zod";

export const prerender = false;

// Validation schema for flashcard generation request
const FlashcardGenerationRequestSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters").max(200, "Topic must be less than 200 characters"),
  difficulty_level: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1, "Count must be at least 1").max(10, "Count must be at most 10").default(5),
  category: z.string().optional(),
  additional_context: z.string().max(1000, "Additional context must be less than 1000 characters").optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
          details: [
            {
              code: "VALIDATION_ERROR",
              message: "Request body must be valid JSON",
            },
          ],
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request data
    let validatedData: FlashcardGenerationRequest;
    try {
      validatedData = FlashcardGenerationRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join("."),
          code: "VALIDATION_ERROR" as const,
          message: err.message,
        }));

        return new Response(
          JSON.stringify({
            success: false,
            error: "Validation failed",
            details,
          } as ErrorResponse),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation error",
          details: [
            {
              code: "VALIDATION_ERROR",
              message: "Invalid request data",
            },
          ],
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user ID from middleware if logged in, or use anonymous ID for rate limiting
    // According to US-016: "Użytkownik MOŻE wygenerować fiszki z tekstu ale nie może ich zapisać"
    const userId = locals.user?.id || "anonymous-user";

    // Check rate limiting
    const rateLimitResult = rateLimiter.isAllowed(userId);
    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60;

      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded",
          details: [
            {
              code: "RATE_LIMIT",
              message: "Too many requests. Try again later.",
            },
          ],
        } as ErrorResponse),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // Create Supabase client and FlashcardService
    const supabase = locals.supabase;
    const flashcardService = new FlashcardService(supabase);

    // Generate flashcard proposals using AI service
    try {
      const result = await flashcardService.generateFlashcardProposals(validatedData, userId);

      const response: ApiResponse<{
        proposals: GeneratedFlashcard[];
        metadata: {
          model_used: string;
          processing_time_ms: number;
          retry_count: number;
        };
      }> = {
        success: true,
        data: {
          proposals: result.proposals,
          metadata: result.metadata,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(rateLimitResult.remaining || 0),
        },
      });
    } catch (aiError: unknown) {
      // Handle AI service specific errors
      const error = aiError as { code?: string; message?: string; retry_after?: number };

      if (error.message?.includes("rate limit") || error.message?.includes("429")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limit exceeded",
            details: [
              {
                code: "RATE_LIMIT",
                message: error.message || "AI service rate limit exceeded",
              },
            ],
          } as ErrorResponse),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(error.retry_after || 60),
            },
          }
        );
      }

      if (error.message?.includes("timeout")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "AI service timeout",
            details: [
              {
                code: "TIMEOUT",
                message: error.message || "AI service request timed out",
              },
            ],
          } as ErrorResponse),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message?.includes("Invalid response") || error.message?.includes("parse")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "AI service error",
            details: [
              {
                code: "AI_SERVICE_ERROR",
                message: error.message || "AI service returned invalid response",
              },
            ],
          } as ErrorResponse),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic AI service error
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI service unavailable",
          details: [
            {
              code: "AI_SERVICE_ERROR",
              message: error.message || "AI service is temporarily unavailable",
            },
          ],
        } as ErrorResponse),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-proposals endpoint:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: [
          {
            code: "UNKNOWN",
            message: "An unexpected error occurred",
          },
        ],
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
