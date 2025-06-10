import { createHash } from "node:crypto";
import type { SupabaseClient } from "../../db/supabase.client";
import type { Tables } from "../../db/database.types";
import type { CheckDuplicateRequest, DuplicateCheckResponseData } from "../../types";
import { normalizeText } from "../validation/flashcard-schemas";

/**
 * Generate SHA-256 hash for content deduplication
 */
export function generateContentHash(text: string): string {
  const normalizedText = normalizeText(text);
  return createHash("sha256").update(normalizedText, "utf8").digest("hex");
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two texts (0-1)
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);

  if (normalized1 === normalized2) {
    return 1.0;
  }

  if (normalized1.length === 0 || normalized2.length === 0) {
    return 0.0;
  }

  // Use Levenshtein distance for similarity calculation
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  return 1 - distance / maxLength;
}

/**
 * Check for exact duplicate based on hash comparison
 */
async function checkExactDuplicate(
  supabase: SupabaseClient,
  userId: string,
  frontTextHash: string
): Promise<Tables<"flashcards"> | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .eq("front_text_hash", frontTextHash)
    .eq("is_deleted", false)
    .limit(1)
    .single();

  if (error) {
    // No exact match found
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Database error during exact duplicate check: ${error.message}`);
  }

  return data;
}

/**
 * Check for similar duplicates using similarity algorithm
 */
async function checkSimilarDuplicate(
  supabase: SupabaseClient,
  userId: string,
  frontText: string,
  backText?: string,
  similarityThreshold = 0.8
): Promise<{ flashcard: Tables<"flashcards">; similarity: number } | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Database error during similarity check: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return null;
  }

  let bestMatch: { flashcard: Tables<"flashcards">; similarity: number } | null = null;

  for (const flashcard of data) {
    // Calculate similarity for front text
    const frontSimilarity = calculateSimilarity(frontText, flashcard.front_text);

    let overallSimilarity = frontSimilarity;

    // If back text is provided, also check back text similarity
    if (backText && flashcard.back_text) {
      const backSimilarity = calculateSimilarity(backText, flashcard.back_text);
      // Weight front text more heavily (70% front, 30% back)
      overallSimilarity = frontSimilarity * 0.7 + backSimilarity * 0.3;
    }

    if (overallSimilarity >= similarityThreshold) {
      if (!bestMatch || overallSimilarity > bestMatch.similarity) {
        bestMatch = { flashcard, similarity: overallSimilarity };
      }
    }
  }

  return bestMatch;
}

/**
 * Main function to check for flashcard duplicates
 */
export async function checkDuplicate(
  supabase: SupabaseClient,
  request: CheckDuplicateRequest,
  userId: string
): Promise<DuplicateCheckResponseData> {
  try {
    // Generate hash for front text
    const frontTextHash = generateContentHash(request.front_text);

    // First, check for exact duplicates using hash
    const exactDuplicate = await checkExactDuplicate(supabase, userId, frontTextHash);

    if (exactDuplicate) {
      return {
        is_duplicate: true,
        existing_flashcard_id: exactDuplicate.id,
        similarity_score: 1.0,
        duplicate_type: "exact",
      };
    }

    // If no exact match, check for similar duplicates
    const similarDuplicate = await checkSimilarDuplicate(supabase, userId, request.front_text, request.back_text);

    if (similarDuplicate) {
      return {
        is_duplicate: true,
        existing_flashcard_id: similarDuplicate.flashcard.id,
        similarity_score: similarDuplicate.similarity,
        duplicate_type: "similar",
      };
    }

    // No duplicates found
    return {
      is_duplicate: false,
      similarity_score: 0,
      duplicate_type: "none",
    };
  } catch (error) {
    console.error("Error in checkDuplicate service:", error);
    throw new Error("Failed to check for duplicates");
  }
}
