/**
 * THIS IS A CUSTOM CONFIG WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
 * Mock Stream Configuration
 * 
 * Quick settings for toggling mock streaming behavior
 * Edit this file to change mock stream behavior without touching StreamingContext
 */

import type { MockStreamVariant } from '@/types/mock-stream';

/**
 * Feature flag: Enable mock streaming
 * Set to true to use mock data, false for real API
 */
export const USE_MOCK_STREAM = false;

/**
 * Mock stream variant to use
 * Options:
 *   - 'basic': Text + single chart
 *   - 'multi': Text + chart + insight + top5  
 *   - 'edge': Delayed/interleaved charts (edge cases)
 *   - 'empty': Just text, no data
 */
export const MOCK_VARIANT: MockStreamVariant = 'basic';

/**
 * Speed multiplier for mock streaming
 * Useful for testing/demo:
 *   - 0.1 = Very fast (10x speed)
 *   - 0.5 = 2x speed
 *   - 1 = Normal speed
 *   - 2 = Half speed (slow)
 *   - 10 = Very slow
 */
export const MOCK_SPEED_MULTIPLIER = 2;

/**
 * Enable detailed logging of mock events
 * Useful for debugging stream behavior
 */
export const MOCK_DEBUG_LOGGING = true;

/**
 * Mock conversation ID for development
 * Used when mock streaming is enabled
 * Can be overridden by URL parameter
 */
export const MOCK_CONVERSATION_ID = 'mock-conv-' + Date.now();

// Export all for easy import
export const MOCK_CONFIG = {
  enabled: USE_MOCK_STREAM,
  variant: MOCK_VARIANT,
  speedMultiplier: MOCK_SPEED_MULTIPLIER,
  debugLogging: MOCK_DEBUG_LOGGING,
  conversationId: MOCK_CONVERSATION_ID,
} as const;
