import type { APIRoute } from "astro";
import { createOpenRouterService } from "../../../lib/services/openrouter.service";

export const GET: APIRoute = async ({ request }) => {
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

    // Create OpenRouter service instance
    const openRouterService = createOpenRouterService(apiKey, false);

    // Get service status
    const serviceStatus = openRouterService.getServiceStatus();

    // Get detailed metrics
    const detailedMetrics = openRouterService.getDetailedMetrics();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          service: serviceStatus,
          metrics: detailedMetrics,
          timestamp: new Date().toISOString(),
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
