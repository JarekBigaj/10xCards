import type { APIRoute } from "astro";
import type {
  AiGenerateCandidatesRequest,
  AiGenerateCandidatesResponse,
  ErrorResponse,
  AiGenerateCandidatesResponseData,
} from "../../../types";

import { FlashcardService } from "../../../lib/services/flashcard.service";
import {
  AiGenerateCandidatesRequestSchema,
  sanitizeInputText,
  formatValidationErrors,
} from "../../../lib/validation/ai-schemas";
import { rateLimiter } from "../../../lib/services/rate-limiter";
import { z } from "zod";

export const prerender = false;

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
    let validatedData: AiGenerateCandidatesRequest;
    try {
      // Sanitize text input before validation
      if (requestBody && typeof requestBody === "object" && "text" in requestBody) {
        const bodyWithText = requestBody as { text: unknown };
        bodyWithText.text = sanitizeInputText(String(bodyWithText.text || ""));
      }

      validatedData = AiGenerateCandidatesRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Validation failed",
            details: formatValidationErrors(error),
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

    // Generate flashcard proposals using FlashcardService (which uses OpenRouter)
    try {
      const result = await flashcardService.generateProposalsFromText(validatedData.text, userId, {
        difficulty_level: "medium",
        count: 5,
        retry_count: validatedData.retry_count || 0,
      });

      // Convert GeneratedFlashcard format to AiCandidate format for backward compatibility
      const candidates = result.proposals.map((proposal) => ({
        id: crypto.randomUUID(),
        front_text: proposal.front_text,
        back_text: proposal.back_text,
        confidence: 0.9, // Default confidence for AI-generated content
        // Preserve additional fields from GeneratedFlashcard
        difficulty: proposal.difficulty,
        category: proposal.category || "General", // Ensure category is always a string
      }));

      const responseData: AiGenerateCandidatesResponseData = {
        candidates,
        generation_metadata: result.metadata,
      };

      const response: AiGenerateCandidatesResponse = {
        success: true,
        data: responseData,
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

      // Handle validation errors (400 Bad Request)
      if (
        error.message?.includes("too long") ||
        error.message?.includes("exceeds") ||
        error.message?.includes("characters")
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Validation failed",
            details: [
              {
                code: "VALIDATION_ERROR",
                message: error.message || "Input validation failed",
              },
            ],
          } as ErrorResponse),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

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
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: [
          {
            code: "UNKNOWN",
            message: "An unexpected error occurred" + error,
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
