// Test environment setup
export const TEST_ENV = {
  PUBLIC_SUPABASE_URL: "http://localhost:54321",
  PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
  OPENROUTER_API_KEY: "test-openrouter-key",
  NODE_ENV: "test",
} as const;
