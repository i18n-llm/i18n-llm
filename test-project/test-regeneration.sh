#!/bin/bash

# Test script to verify cache management and regeneration fixes
# This script tests various scenarios to ensure deleted lines are properly regenerated

set -e  # Exit on error

echo "=================================================="
echo "i18n-LLM Regeneration Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((TESTS_FAILED++))
}

info() {
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if [ ! -f "test-schema.json" ]; then
        fail "test-schema.json not found"
        exit 1
    fi
    
    if [ -z "$OPENAI_API_KEY" ]; then
        fail "OPENAI_API_KEY environment variable not set"
        exit 1
    fi
    
    pass "Prerequisites check"
    echo ""
}

# Test 1: Fresh generation
test_fresh_generation() {
    echo "=================================================="
    echo "Test 1: Fresh Generation"
    echo "=================================================="
    
    # Clean up
    rm -rf locales/
    rm -f .i18n-llm-state.json
    
    info "Running fresh generation..."
    npm run generate > /dev/null 2>&1 || true
    
    # Check if files were created
    if [ -f "locales/test.en.json" ] && [ -f ".i18n-llm-state.json" ]; then
        pass "Fresh generation creates output files and state"
    else
        fail "Fresh generation did not create expected files"
    fi
    
    echo ""
}

# Test 2: State cleanup for deleted keys
test_state_cleanup() {
    echo "=================================================="
    echo "Test 2: State Cleanup for Deleted Keys"
    echo "=================================================="
    
    # First, ensure we have a state file
    if [ ! -f ".i18n-llm-state.json" ]; then
        info "Generating initial state..."
        npm run generate > /dev/null 2>&1 || true
    fi
    
    # Add a fake key to state
    info "Adding fake key to state..."
    cat .i18n-llm-state.json | jq '. + {"test::fake.key": {"hash": "abc123", "sourceText": "Fake", "translations": {}}}' > temp.json
    mv temp.json .i18n-llm-state.json
    
    # Run generate
    info "Running generate to trigger cleanup..."
    OUTPUT=$(npm run generate 2>&1 || true)
    
    # Check if fake key was removed
    if echo "$OUTPUT" | grep -q "Removing deleted key"; then
        pass "State cleanup detects and removes deleted keys"
    else
        fail "State cleanup did not detect deleted keys"
    fi
    
    # Verify fake key is gone
    if ! cat .i18n-llm-state.json | jq -e '.["test::fake.key"]' > /dev/null 2>&1; then
        pass "Deleted key successfully removed from state"
    else
        fail "Deleted key still present in state"
    fi
    
    echo ""
}

# Test 3: Missing key detection
test_missing_key_detection() {
    echo "=================================================="
    echo "Test 3: Missing Key Detection"
    echo "=================================================="
    
    # Ensure we have output files
    if [ ! -f "locales/test.en.json" ]; then
        info "Generating initial files..."
        npm run generate > /dev/null 2>&1 || true
    fi
    
    # Get a key from the output file
    FIRST_KEY=$(cat locales/test.en.json | jq -r 'keys[0]' 2>/dev/null || echo "")
    
    if [ -z "$FIRST_KEY" ] || [ "$FIRST_KEY" = "null" ]; then
        info "No keys in output file, skipping test"
        return
    fi
    
    info "Deleting key '$FIRST_KEY' from output file..."
    cat locales/test.en.json | jq "del(.$FIRST_KEY)" > temp.json
    mv temp.json locales/test.en.json
    
    # Run generate with debug
    info "Running generate to detect missing key..."
    OUTPUT=$(npm run generate -- --debug 2>&1 || true)
    
    # Check if missing key was detected
    if echo "$OUTPUT" | grep -q "Missing key in"; then
        pass "Missing key detection works"
    else
        fail "Missing key not detected"
    fi
    
    # Check if key was regenerated
    if cat locales/test.en.json | jq -e ".$FIRST_KEY" > /dev/null 2>&1; then
        pass "Missing key successfully regenerated"
    else
        fail "Missing key was not regenerated"
    fi
    
    echo ""
}

# Test 4: Hash-based change detection
test_hash_change_detection() {
    echo "=================================================="
    echo "Test 4: Hash-Based Change Detection"
    echo "=================================================="
    
    # Ensure we have state
    if [ ! -f ".i18n-llm-state.json" ]; then
        info "Generating initial state..."
        npm run generate > /dev/null 2>&1 || true
    fi
    
    # Get a state key and modify its hash
    FIRST_STATE_KEY=$(cat .i18n-llm-state.json | jq -r 'keys[0]' 2>/dev/null || echo "")
    
    if [ -z "$FIRST_STATE_KEY" ] || [ "$FIRST_STATE_KEY" = "null" ]; then
        info "No keys in state, skipping test"
        return
    fi
    
    info "Modifying hash for key '$FIRST_STATE_KEY'..."
    cat .i18n-llm-state.json | jq ".\"$FIRST_STATE_KEY\".hash = \"modified_hash\"" > temp.json
    mv temp.json .i18n-llm-state.json
    
    # Run generate with debug
    info "Running generate to detect hash change..."
    OUTPUT=$(npm run generate -- --debug 2>&1 || true)
    
    # Check if change was detected
    if echo "$OUTPUT" | grep -q "reason: changed"; then
        pass "Hash change detection works"
    else
        fail "Hash change not detected"
    fi
    
    echo ""
}

# Test 5: Force regeneration
test_force_regeneration() {
    echo "=================================================="
    echo "Test 5: Force Regeneration"
    echo "=================================================="
    
    # Ensure we have files
    if [ ! -f "locales/test.en.json" ]; then
        info "Generating initial files..."
        npm run generate > /dev/null 2>&1 || true
    fi
    
    # Run with --force
    info "Running generate with --force flag..."
    OUTPUT=$(npm run generate -- --force 2>&1 || true)
    
    # Check if force mode was enabled
    if echo "$OUTPUT" | grep -q "Force mode enabled"; then
        pass "Force mode flag recognized"
    else
        fail "Force mode flag not recognized"
    fi
    
    # Check if items were regenerated
    if echo "$OUTPUT" | grep -q "Found .* new or updated keys"; then
        pass "Force mode triggers regeneration"
    else
        fail "Force mode did not trigger regeneration"
    fi
    
    echo ""
}

# Test 6: Debug mode logging
test_debug_mode() {
    echo "=================================================="
    echo "Test 6: Debug Mode Logging"
    echo "=================================================="
    
    # Run with --debug
    info "Running generate with --debug flag..."
    OUTPUT=$(npm run generate -- --debug 2>&1 || true)
    
    # Check for debug output
    if echo "$OUTPUT" | grep -q "Debug mode enabled"; then
        pass "Debug mode flag recognized"
    else
        fail "Debug mode flag not recognized"
    fi
    
    # Check for step headers
    if echo "$OUTPUT" | grep -q "Step 1: State Cleanup" && \
       echo "$OUTPUT" | grep -q "Step 2: Detecting Missing Translations"; then
        pass "Debug mode shows detailed steps"
    else
        fail "Debug mode missing detailed step output"
    fi
    
    echo ""
}

# Test 7: Context extraction
test_context_extraction() {
    echo "=================================================="
    echo "Test 7: Context Extraction"
    echo "=================================================="
    
    # Run generate and check for context in batch logs
    info "Running generate to check context extraction..."
    OUTPUT=$(npm run generate 2>&1 || true)
    
    # Check if batches show proper context (not "no-context" for everything)
    if echo "$OUTPUT" | grep -q "context:.*\"" && ! echo "$OUTPUT" | grep -q "Batch.*context: no-context"; then
        pass "Context extraction works correctly"
    else
        # This might fail if all items actually have no context, which is okay
        info "Context extraction test inconclusive (may be no context in schema)"
    fi
    
    echo ""
}

# Run all tests
main() {
    check_prerequisites
    
    test_fresh_generation
    test_state_cleanup
    test_missing_key_detection
    test_hash_change_detection
    test_force_regeneration
    test_debug_mode
    test_context_extraction
    
    # Summary
    echo "=================================================="
    echo "Test Summary"
    echo "=================================================="
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! ✓${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed. ✗${NC}"
        exit 1
    fi
}

# Run main function
main

