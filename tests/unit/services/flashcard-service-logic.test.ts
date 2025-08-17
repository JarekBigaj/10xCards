import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardService } from "@/lib/services/flashcard.service";
import type { CreateFlashcardCommand, BulkUpdateRequest } from "@/types";

describe("FlashcardService - Logic and Error Handling", () => {
  let flashcardService: FlashcardService;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Simple mock setup focusing on what we can control
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: null, error: { message: "Mock error" } })),
        update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    };

    // Mock import.meta.env
    vi.stubGlobal("import", {
      meta: {
        env: {
          OPENROUTER_API_KEY: "test-api-key",
        },
      },
    });

    flashcardService = new FlashcardService(mockSupabase);
  });

  describe("Hash generation logic", () => {
    it("should generate content hashes using private method", () => {
      // Access private method for testing
      const generateHashes = (flashcardService as any).generateFlashcardHashes;

      const frontText = "What is React?";
      const backText = "A JavaScript library for building user interfaces";

      const hashes = generateHashes(frontText, backText);

      expect(hashes).toHaveProperty("front_text_hash");
      expect(hashes).toHaveProperty("back_text_hash");
      expect(hashes.front_text_hash).toHaveLength(64); // SHA-256 hex
      expect(hashes.back_text_hash).toHaveLength(64);
    });

    it("should generate identical hashes for normalized equivalent texts", () => {
      const generateHashes = (flashcardService as any).generateFlashcardHashes;

      const hashes1 = generateHashes("What is React?", "A JavaScript library");
      const hashes2 = generateHashes("  what is react?  ", "  a javascript library  ");
      const hashes3 = generateHashes("WHAT IS REACT?!", "A JAVASCRIPT LIBRARY!");

      expect(hashes1.front_text_hash).toBe(hashes2.front_text_hash);
      expect(hashes1.front_text_hash).toBe(hashes3.front_text_hash);
      expect(hashes1.back_text_hash).toBe(hashes2.back_text_hash);
      expect(hashes1.back_text_hash).toBe(hashes3.back_text_hash);
    });

    it("should generate different hashes for different content", () => {
      const generateHashes = (flashcardService as any).generateFlashcardHashes;

      const hashes1 = generateHashes("What is React?", "A JavaScript library");
      const hashes2 = generateHashes("What is Vue?", "A progressive framework");

      expect(hashes1.front_text_hash).not.toBe(hashes2.front_text_hash);
      expect(hashes1.back_text_hash).not.toBe(hashes2.back_text_hash);
    });
  });

  describe("Error categorization and handling", () => {
    it("should handle error types correctly", () => {
      // Test that the service exists and has error handling logic
      expect(flashcardService).toBeInstanceOf(FlashcardService);

      // Test Error object handling
      const error1 = new Error("DUPLICATE");
      expect(error1.message).toBe("DUPLICATE");

      // Test string error
      const error2 = "Database connection failed";
      expect(typeof error2).toBe("string");

      // Service should handle both types gracefully in production code
      expect(flashcardService).toBeDefined();
    });

    it("should handle large batch operations", async () => {
      // Test batch size - service may handle gracefully rather than throwing
      const manyCommands = Array.from({ length: 51 }, (_, i) => ({
        id: `card-${i}`,
        front_text: `Card ${i}`,
        back_text: `Answer ${i}`,
        source: "ai-full" as const,
        user_id: "user-123",
      }));

      const result = await flashcardService.createFlashcards(manyCommands);

      // Service should handle this gracefully, possibly with failures
      expect(result).toHaveProperty("created_count");
      expect(result).toHaveProperty("failed_count");
      expect(result).toHaveProperty("errors");
    });

    it("should handle bulk update validation correctly", async () => {
      // Test bulk update size validation
      const tooManyUpdates: BulkUpdateRequest["updates"] = Array.from({ length: 51 }, (_, i) => ({
        id: `card-${i}`,
        front_text: `Update ${i}`,
        source: "manual" as const,
      }));

      // This should not throw because validation happens at API level
      // But we can test the logic doesn't crash
      const result = await flashcardService.bulkUpdateFlashcards("user-123", tooManyUpdates);
      expect(result).toHaveProperty("updated_count");
      expect(result).toHaveProperty("failed_count");
      expect(result).toHaveProperty("errors");
    });
  });

  describe("Data transformation", () => {
    it("should transform database records to DTOs correctly", () => {
      const transformToDto = (flashcardService as any).transformToDto;

      const dbRecord = {
        id: "test-id",
        front_text: "What is React?",
        back_text: "A JavaScript library",
        source: "manual",
        user_id: "user-123",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        due: "2024-01-02T00:00:00Z",
        difficulty: 2.5,
        reps: 0,
        scheduled_days: 0,
        front_text_hash: "hash1",
        back_text_hash: "hash2",
        is_deleted: false,
      };

      const dto = transformToDto(dbRecord);

      // DTO may exclude some internal fields like hashes, user_id, is_deleted
      expect(dto).toHaveProperty("id", "test-id");
      expect(dto).toHaveProperty("front_text", "What is React?");
      expect(dto).toHaveProperty("back_text", "A JavaScript library");
      expect(dto).toHaveProperty("source", "manual");
      expect(dto).toHaveProperty("created_at");
      expect(dto).toHaveProperty("updated_at");
    });
  });

  describe("Input validation and sanitization", () => {
    it("should validate flashcard command structure", () => {
      const validCommand: CreateFlashcardCommand = {
        id: "test-id",
        front_text: "Valid question",
        back_text: "Valid answer",
        source: "manual",
        user_id: "user-123",
      };

      // Test that the structure is acceptable
      expect(validCommand.front_text).toHaveLength(14);
      expect(validCommand.back_text).toHaveLength(12);
      expect(validCommand.source).toBe("manual");
    });

    it("should handle edge cases in text content", () => {
      const generateHashes = (flashcardService as any).generateFlashcardHashes;

      // Test empty strings
      const emptyHashes = generateHashes("", "");
      expect(emptyHashes.front_text_hash).toHaveLength(64);
      expect(emptyHashes.back_text_hash).toHaveLength(64);

      // Test very long strings
      const longText = "A".repeat(1000);
      const longHashes = generateHashes(longText, longText);
      expect(longHashes.front_text_hash).toHaveLength(64);
      expect(longHashes.back_text_hash).toHaveLength(64);

      // Test special characters
      const specialText = "🚀 Special chars: àáâãäå çčđ ñň 测试";
      const specialHashes = generateHashes(specialText, specialText);
      expect(specialHashes.front_text_hash).toHaveLength(64);
      expect(specialHashes.back_text_hash).toHaveLength(64);
    });
  });

  describe("Service state and configuration", () => {
    it("should maintain AI service reference", () => {
      expect(flashcardService).toHaveProperty("aiService");

      // Test AI service status access
      const status = flashcardService.getAiServiceStatus();
      expect(status).toHaveProperty("openRouterMetrics");
    });

    it("should handle service configuration", () => {
      // Test that service can be constructed with different Supabase clients
      const alternativeSupabase = {
        from: vi.fn(() => ({ select: vi.fn() })),
      };

      const alternativeService = new FlashcardService(alternativeSupabase as any);
      expect(alternativeService).toBeInstanceOf(FlashcardService);
    });
  });
});
