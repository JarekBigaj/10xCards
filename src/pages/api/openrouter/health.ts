import type { APIRoute } from "astro";
import { createOpenRouterMetricsCollector } from "../../../lib/services/openrouter-metrics";

export const GET: APIRoute = async () => {
  try {
    // Create metrics collector
    const metricsCollector = createOpenRouterMetricsCollector();

    // Perform health check
    const healthCheck = metricsCollector.performHealthCheck();

    // Get current metrics
    const metrics = metricsCollector.getMetrics();

    // Set appropriate HTTP status based on health
    let status = 200;
    if (healthCheck.status === "unhealthy") {
      status = 503; // Service Unavailable
    } else if (healthCheck.status === "degraded") {
      status = 200; // OK but with warnings
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          health: healthCheck,
          metrics: {
            // Only include basic metrics for health check
            uptime: metrics.uptime,
            totalRequests: metrics.totalRequests,
            errorRate: metrics.errorRate,
            averageResponseTime: metrics.averageResponseTime,
          },
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
          // Add health check headers
          "X-Health-Status": healthCheck.status,
          "X-Health-Message": healthCheck.overall.message,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Health-Status": "unhealthy",
          "X-Health-Message": "Health check failed",
        },
      }
    );
  }
};

export const prerender = false;
