import type { JSONSchema } from "../../types";

/**
 * JSON Schema for flashcard generation responses
 * This schema ensures structured and consistent responses from AI models
 */
export const FLASHCARD_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front_text: {
            type: "string",
            maxLength: 200,
            description: "Question or prompt for the front of the flashcard",
          },
          back_text: {
            type: "string",
            maxLength: 500,
            description: "Answer or explanation for the back of the flashcard",
          },
          difficulty: {
            type: "string",
            enum: ["easy", "medium", "hard"],
            description: "Difficulty level of the flashcard",
          },
          category: {
            type: "string",
            description: "Optional category for organizing flashcards",
          },
        },
        required: ["front_text", "back_text", "difficulty", "category"],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 10,
      description: "Array of generated flashcards",
    },
  },
  required: ["flashcards"],
  additionalProperties: false,
};

/**
 * System prompt for flashcard generation
 * Designed to work with structured JSON responses
 */
export const FLASHCARD_SYSTEM_PROMPT = `You are an expert educational content creator specializing in flashcard generation. Your task is to create high-quality, educational flashcards based on the given topic and requirements.

Instructions:
1. Generate the exact number of flashcards requested (1-10)
2. Each flashcard must have a clear, concise question (front_text) and accurate answer (back_text)
3. Vary question types: definitions, explanations, examples, comparisons, problem-solving
4. Ensure questions are specific, unambiguous, and test understanding
5. Keep front_text under 200 characters and back_text under 500 characters
6. Match the requested difficulty level appropriately
7. Use the specified category if provided
8. Focus on key concepts, important facts, and fundamental understanding

Response Format:
You must respond with valid JSON that exactly matches this schema:
- front_text: The question or prompt (max 200 chars)
- back_text: The answer or explanation (max 500 chars)
- difficulty: Must be "easy", "medium", or "hard"
- category: Optional category for organization

Quality Standards:
- Questions should be clear and test actual knowledge
- Answers should be complete but concise
- Difficulty should match the requested level
- Content should be accurate and educational
- Avoid trivial or overly simple questions for higher difficulty levels`;
