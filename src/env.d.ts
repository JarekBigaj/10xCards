/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: User | null;
      session: { access_token: string; refresh_token: string; expires_at: number } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_DEFAULT_MODEL?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
