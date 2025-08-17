#!/bin/bash

# Test script for flashcard deletion
BASE_URL="http://localhost:3000"

echo "=== Flashcard Deletion Test ==="

# Step 1: Login as test user
echo "1. Logging in as test@gmail.com..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "12345678Ax"
  }' \
  -c cookies.txt)

echo "Login response: $LOGIN_RESPONSE"

# Step 2: Get flashcards list to find IDs
echo -e "\n2. Getting flashcards list..."
FLASHCARDS_RESPONSE=$(curl -s -b cookies.txt "${BASE_URL}/api/flashcards?limit=3")
echo "Flashcards response: $FLASHCARDS_RESPONSE"

# Extract first flashcard ID using jq if available, otherwise manually
FLASHCARD_ID=$(echo "$FLASHCARDS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$FLASHCARD_ID" ]; then
  echo "No flashcard ID found. Using dummy ID for test..."
  FLASHCARD_ID="11111111-1111-1111-1111-111111111111"
fi

echo "Using flashcard ID: $FLASHCARD_ID"

# Step 3: Try to delete the flashcard
echo -e "\n3. Attempting to delete flashcard..."
DELETE_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/api/flashcards/${FLASHCARD_ID}" \
  -b cookies.txt \
  -H "Content-Type: application/json")

echo "Delete response: $DELETE_RESPONSE"

# Step 4: Verify deletion by checking if flashcard still exists
echo -e "\n4. Verifying deletion..."
VERIFY_RESPONSE=$(curl -s -b cookies.txt "${BASE_URL}/api/flashcards/${FLASHCARD_ID}")
echo "Verify response: $VERIFY_RESPONSE"

echo -e "\n=== Test completed ==="
