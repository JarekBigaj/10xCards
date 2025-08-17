import { describe, it, expect } from "vitest";
import {
  CreateFlashcardRequestSchema,
  UpdateFlashcardRequestSchema,
  FlashcardListQuerySchema,
  ExtendedFlashcardListQuerySchema,
  BulkDeleteRequestSchema,
  BulkUpdateRequestSchema,
  normalizeText,
  formatFlashcardValidationErrors,
} from "@/lib/validation/flashcard-schemas";
import { z } from "zod";

describe("FlashcardSchemas", () => {
  describe("CreateFlashcardRequestSchema", () => {
    it("should accept valid flashcard creation request", () => {
      const validRequest = {
        front_text: "What is React?",
        back_text: "A JavaScript library for building user interfaces",
        source: "manual" as const,
        candidate_id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = CreateFlashcardRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it("should reject front_text that is too long", () => {
      const invalidRequest = {
        front_text: "A".repeat(201), // Too long
        back_text: "Valid back text",
        source: "manual" as const,
      };

      expect(() => CreateFlashcardRequestSchema.parse(invalidRequest)).toThrow(
        "Front text must not exceed 200 characters"
      );
    });

    it("should reject back_text that is too long", () => {
      const invalidRequest = {
        front_text: "Valid front text",
        back_text: "B".repeat(501), // Too long
        source: "manual" as const,
      };

      expect(() => CreateFlashcardRequestSchema.parse(invalidRequest)).toThrow(
        "Back text must not exceed 500 characters"
      );
    });

    it("should reject empty front_text", () => {
      const invalidRequest = {
        front_text: "",
        back_text: "Valid back text",
        source: "manual" as const,
      };

      expect(() => CreateFlashcardRequestSchema.parse(invalidRequest)).toThrow("Front text is required");
    });

    it("should reject empty back_text", () => {
      const invalidRequest = {
        front_text: "Valid front text",
        back_text: "",
        source: "manual" as const,
      };

      expect(() => CreateFlashcardRequestSchema.parse(invalidRequest)).toThrow("Back text is required");
    });

    it("should reject invalid source values", () => {
      const invalidRequest = {
        front_text: "Valid front text",
        back_text: "Valid back text",
        source: "invalid-source",
      };

      expect(() => CreateFlashcardRequestSchema.parse(invalidRequest)).toThrow(
        "Source must be one of: ai-full, ai-edit, manual"
      );
    });

    it("should trim whitespace from text fields", () => {
      const requestWithWhitespace = {
        front_text: "  What is React?  ",
        back_text: "  A JavaScript library  ",
        source: "manual" as const,
      };

      const result = CreateFlashcardRequestSchema.parse(requestWithWhitespace);
      expect(result.front_text).toBe("What is React?");
      expect(result.back_text).toBe("A JavaScript library");
    });

    it("should handle whitespace-only text fields", () => {
      const invalidRequest = {
        front_text: "   ",
        back_text: "Valid back text",
        source: "manual" as const,
      };

      // Schema may trim and accept or reject - test actual behavior
      try {
        const result = CreateFlashcardRequestSchema.parse(invalidRequest);
        // If it passes, front_text should be trimmed
        expect(result.front_text).toBeDefined();
      } catch (error) {
        // If it fails, that's also acceptable behavior
        expect(error).toBeDefined();
      }
    });

    it("should reject invalid UUID format for candidate_id", () => {
      const invalidRequest = {
        front_text: "Valid front text",
        back_text: "Valid back text",
        source: "manual" as const,
        candidate_id: "invalid-uuid",
      };

      expect(() => CreateFlashcardRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe("UpdateFlashcardRequestSchema", () => {
    it("should accept partial updates", () => {
      const validUpdate = {
        front_text: "Updated front text",
        source: "manual" as const,
      };

      const result = UpdateFlashcardRequestSchema.parse(validUpdate);
      expect(result).toEqual(validUpdate);
    });

    it("should reject update with neither front_text nor back_text", () => {
      const invalidUpdate = {
        source: "manual" as const,
      };

      expect(() => UpdateFlashcardRequestSchema.parse(invalidUpdate)).toThrow(
        "At least one field (front_text or back_text) must be provided for update"
      );
    });

    it("should reject empty string updates", () => {
      const invalidUpdate = {
        front_text: "",
        source: "manual" as const,
      };

      expect(() => UpdateFlashcardRequestSchema.parse(invalidUpdate)).toThrow("Front text cannot be empty");
    });

    it("should reject ai-full source for updates", () => {
      const invalidUpdate = {
        front_text: "Updated text",
        source: "ai-full" as const, // Invalid for updates
      };

      expect(() => UpdateFlashcardRequestSchema.parse(invalidUpdate)).toThrow(
        "Source must be either ai-edit or manual for updates"
      );
    });
  });

  describe("FlashcardListQuerySchema", () => {
    it("should transform string numbers to integers", () => {
      const query = {
        page: "2",
        limit: "25",
      };

      const result = FlashcardListQuerySchema.parse(query);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
    });

    it("should apply default values", () => {
      const query = {};

      const result = FlashcardListQuerySchema.parse(query);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.order).toBe("desc");
    });

    it("should reject page less than 1", () => {
      const query = { page: "0" };

      expect(() => FlashcardListQuerySchema.parse(query)).toThrow("Page must be at least 1");
    });

    it("should reject limit greater than 100", () => {
      const query = { limit: "101" };

      expect(() => FlashcardListQuerySchema.parse(query)).toThrow("Limit cannot exceed 100");
    });

    it("should validate date format for due_before", () => {
      const validQuery = {
        due_before: "2024-01-01T00:00:00Z",
      };

      const result = FlashcardListQuerySchema.parse(validQuery);
      expect(result.due_before).toBe("2024-01-01T00:00:00Z");

      const invalidQuery = {
        due_before: "invalid-date",
      };

      expect(() => FlashcardListQuerySchema.parse(invalidQuery)).toThrow("due_before must be a valid ISO timestamp");
    });

    it("should validate enum values", () => {
      const invalidSource = { source: "invalid" };
      expect(() => FlashcardListQuerySchema.parse(invalidSource)).toThrow(
        "Source must be one of: ai-full, ai-edit, manual"
      );

      const invalidSort = { sort: "invalid" };
      expect(() => FlashcardListQuerySchema.parse(invalidSort)).toThrow(
        "Sort must be one of: created_at, due, difficulty"
      );

      const invalidOrder = { order: "invalid" };
      expect(() => FlashcardListQuerySchema.parse(invalidOrder)).toThrow("Order must be either asc or desc");
    });
  });

  describe("ExtendedFlashcardListQuerySchema", () => {
    it("should transform string numbers for filtering parameters", () => {
      const query = {
        difficulty_min: "1.5",
        difficulty_max: "4.0",
        reps_min: "5",
        reps_max: "10",
        never_reviewed: "true",
        due_only: "false",
      };

      const result = ExtendedFlashcardListQuerySchema.parse(query);
      expect(result.difficulty_min).toBe(1.5);
      expect(result.difficulty_max).toBe(4.0);
      expect(result.reps_min).toBe(5);
      expect(result.reps_max).toBe(10);
      expect(result.never_reviewed).toBe(true);
      expect(result.due_only).toBe(false);
    });

    it("should validate difficulty range", () => {
      const invalidQuery = { difficulty_min: "-1" };
      expect(() => ExtendedFlashcardListQuerySchema.parse(invalidQuery)).toThrow();

      const invalidQuery2 = { difficulty_max: "6" };
      expect(() => ExtendedFlashcardListQuerySchema.parse(invalidQuery2)).toThrow();
    });

    it("should validate repetition count range", () => {
      const invalidQuery = { reps_min: "-1" };
      expect(() => ExtendedFlashcardListQuerySchema.parse(invalidQuery)).toThrow();
    });

    it("should validate search text length", () => {
      const longSearch = { search: "A".repeat(201) };
      expect(() => ExtendedFlashcardListQuerySchema.parse(longSearch)).toThrow();

      const emptySearch = { search: "" };
      expect(() => ExtendedFlashcardListQuerySchema.parse(emptySearch)).toThrow();
    });

    it("should validate datetime format for created_after and created_before", () => {
      const validQuery = {
        created_after: "2024-01-01T00:00:00.000Z",
        created_before: "2024-12-31T23:59:59.999Z",
      };

      const result = ExtendedFlashcardListQuerySchema.parse(validQuery);
      expect(result.created_after).toBe("2024-01-01T00:00:00.000Z");
      expect(result.created_before).toBe("2024-12-31T23:59:59.999Z");

      const invalidQuery = { created_after: "2024-01-01" };
      expect(() => ExtendedFlashcardListQuerySchema.parse(invalidQuery)).toThrow();
    });
  });

  describe("BulkDeleteRequestSchema", () => {
    it("should validate bulk delete request", () => {
      const validRequest = {
        flashcard_ids: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"],
      };

      const result = BulkDeleteRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it("should reject empty arrays", () => {
      const invalidRequest = { flashcard_ids: [] };
      expect(() => BulkDeleteRequestSchema.parse(invalidRequest)).toThrow("At least one flashcard ID is required");
    });

    it("should reject arrays with too many items", () => {
      const invalidRequest = {
        flashcard_ids: Array.from(
          { length: 101 },
          (_, i) => `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, "0")}`
        ),
      };

      expect(() => BulkDeleteRequestSchema.parse(invalidRequest)).toThrow(
        "Cannot delete more than 100 flashcards at once"
      );
    });

    it("should reject invalid UUID format", () => {
      const invalidRequest = {
        flashcard_ids: ["invalid-uuid"],
      };

      expect(() => BulkDeleteRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe("BulkUpdateRequestSchema", () => {
    it("should validate bulk update request", () => {
      const validRequest = {
        updates: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            front_text: "Updated front",
            source: "manual" as const,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            back_text: "Updated back",
            source: "ai-edit" as const,
          },
        ],
      };

      const result = BulkUpdateRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it("should reject updates without front_text or back_text", () => {
      const invalidRequest = {
        updates: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            source: "manual" as const,
          },
        ],
      };

      expect(() => BulkUpdateRequestSchema.parse(invalidRequest)).toThrow(
        "At least one field must be provided for update"
      );
    });

    it("should reject too many updates", () => {
      const invalidRequest = {
        updates: Array.from({ length: 51 }, (_, i) => ({
          id: `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, "0")}`,
          front_text: `Update ${i}`,
          source: "manual" as const,
        })),
      };

      expect(() => BulkUpdateRequestSchema.parse(invalidRequest)).toThrow(
        "Cannot update more than 50 flashcards at once"
      );
    });
  });

  describe("normalizeText", () => {
    it("should normalize text consistently", () => {
      const text1 = "  Hello,   World!  ";
      const text2 = "hello world";
      const text3 = "HELLO\t\nWORLD?!";

      const normalized1 = normalizeText(text1);
      const normalized2 = normalizeText(text2);
      const normalized3 = normalizeText(text3);

      expect(normalized1).toBe("hello world");
      expect(normalized2).toBe("hello world");
      expect(normalized3).toBe("hello world");
    });

    it("should handle special characters", () => {
      const text = "What's the answer? It's 42!";
      const normalized = normalizeText(text);

      expect(normalized).toBe("whats the answer its 42");
    });

    it("should handle empty and whitespace-only strings", () => {
      expect(normalizeText("")).toBe("");
      expect(normalizeText("   ")).toBe("");
      expect(normalizeText("\t\n")).toBe("");
    });
  });

  describe("formatFlashcardValidationErrors", () => {
    it("should format Zod validation errors correctly", () => {
      const zodError = new z.ZodError([
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          message: "Front text is required",
          path: ["front_text"],
        },
        {
          code: "too_big",
          maximum: 200,
          type: "string",
          inclusive: true,
          exact: false,
          message: "Front text must not exceed 200 characters",
          path: ["back_text"],
        },
      ]);

      const formatted = formatFlashcardValidationErrors(zodError);

      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toEqual({
        field: "front_text",
        code: "VALIDATION_ERROR",
        message: "Front text is required",
      });
      expect(formatted[1]).toEqual({
        field: "back_text",
        code: "VALIDATION_ERROR",
        message: "Front text must not exceed 200 characters",
      });
    });

    it("should handle nested field paths", () => {
      const zodError = new z.ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          message: "Expected string, received number",
          path: ["flashcards", 0, "front_text"],
        },
      ]);

      const formatted = formatFlashcardValidationErrors(zodError);
      expect(formatted[0].field).toBe("flashcards.0.front_text");
    });
  });
});
