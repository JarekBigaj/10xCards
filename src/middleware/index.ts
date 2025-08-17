import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { defineMiddleware } from "astro:middleware";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/forgot-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  // Generate page accessible for non-logged users (but can't save)
  "/generate",
  // AI generation endpoints accessible for all users
  "/api/ai/generate-candidates",
  "/api/flashcards/generate-proposals",
  "/api/openrouter/generate",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create supabase instance with cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  locals.supabase = supabase;

  // IMPORTANT: Always try to get user session for all routes
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (user && !authError) {
      locals.user = user;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        locals.session = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
        };
      }

      // IMPORTANT: Set the session in the supabase client for RLS to work
      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }
    } else {
      locals.user = null;
      locals.session = null;
    }
  } catch (error) {
    locals.user = null;
    locals.session = null;
    // eslint-disable-next-line no-console
    console.error("Error in middleware:", error);
  }

  // For public paths, continue regardless of auth status
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // For protected routes, redirect if not authenticated
  if (!locals.user) {
    return redirect("/auth/login");
  }

  return next();
});
