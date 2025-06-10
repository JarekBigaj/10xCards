import type { APIRoute } from "astro";
import type {
  AiGenerateCandidatesRequest,
  AiGenerateCandidatesResponse,
  ErrorResponse,
  AiGenerateCandidatesResponseData,
} from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import {
  AiGenerateCandidatesRequestSchema,
  sanitizeInputText,
  formatValidationErrors,
} from "../../../lib/validation/ai-schemas";
import { createAiService } from "../../../lib/services/ai.service";
import { rateLimiter } from "../../../lib/services/rate-limiter";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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

    // TODO: Add proper authentication check when middleware is ready
    // For now, use DEFAULT_USER_ID for testing
    const userId = DEFAULT_USER_ID;

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

    // Create AI service instance (using mocks for testing)
    const aiService = createAiService(true);

    // Generate flashcard candidates
    try {
      const result = await aiService.generateCandidates(validatedData.text, validatedData.retry_count);

      const responseData: AiGenerateCandidatesResponseData = {
        candidates: result.candidates,
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

      if (error.code === "RATE_LIMIT") {
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

      if (error.code === "TIMEOUT") {
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

      if (error.code === "MODEL_ERROR") {
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
              message: "AI service is temporarily unavailable",
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
    console.error("Error in generate-candidates endpoint:", error);

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
