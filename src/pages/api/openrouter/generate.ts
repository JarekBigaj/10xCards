import type { APIRoute } from "astro";
import { createOpenRouterService } from "../../../lib/services/openrouter.service";
import type { FlashcardGenerationRequest } from "../../../types";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get API key from environment or request headers
    const apiKey = import.meta.env.OPENROUTER_API_KEY || request.headers.get("x-api-key");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OpenRouter API key not provided",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request
    if (!body.topic || typeof body.topic !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Topic is required and must be a string",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create flashcard generation request
    const flashcardRequest: FlashcardGenerationRequest = {
      topic: body.topic,
      difficulty_level: body.difficulty_level || "medium",
      count: body.count || 5,
      category: body.category,
      additional_context: body.additional_context,
    };

    // Validate count range
    if (flashcardRequest.count < 1 || flashcardRequest.count > 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Count must be between 1 and 10",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create OpenRouter service instance
    const openRouterService = createOpenRouterService(apiKey, false);

    // Generate flashcards
    const startTime = Date.now();
    const result = await openRouterService.generateFlashcards(flashcardRequest);
    const totalTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          flashcards: result.flashcards,
          metadata: {
            ...result.metadata,
            total_request_time_ms: totalTime,
          },
          service_status: openRouterService.getServiceStatus(),
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating flashcards:", error);

    // Handle specific OpenRouter errors
    if (error && typeof error === "object" && "code" in error) {
      const openRouterError = error as { code: string; message: string; isRetryable?: boolean };

      return new Response(
        JSON.stringify({
          success: false,
          error: openRouterError.message,
          code: openRouterError.code,
          is_retryable: openRouterError.isRetryable || false,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const prerender = false;
