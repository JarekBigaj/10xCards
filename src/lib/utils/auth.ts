import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Configuration for authentication mode
 * Set to true to enable real authentication, false for testing with DEFAULT_USER_ID
 */
export const AUTH_ENABLED = false;

/**
 * Get the current user ID for API requests
 * In test mode: returns DEFAULT_USER_ID
 * In production mode: gets user from Supabase auth
 */
export async function getCurrentUserId(supabase: SupabaseClient): Promise<{
  userId: string | null;
  error?: string;
}> {
  if (!AUTH_ENABLED) {
    // Test mode - use default user ID
    return { userId: DEFAULT_USER_ID };
  }

  // Production mode - get user from Supabase auth
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return { userId: null, error: authError.message };
    }

    if (!user) {
      return { userId: null, error: "User not authenticated" };
    }

    return { userId: user.id };
  } catch (error) {
    return {
      userId: null,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

/**
 * Create authentication error response
 */
export function createAuthenticationError() {
  return {
    success: false as const,
    error: "Authentication required",
  };
}
