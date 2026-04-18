/**
 * Mock Streaming Event Types
 * Matches backend SSE event structure for development/testing
 */

export type StreamEventType = 
  | 'start'
  | 'text-start'
  | 'text-delta'
  | 'text-end'
  | 'data'
  | 'data-chart'
  | 'finish'
  | 'error';

export interface StreamEventStart {
  type: 'start';
  messageId: string;
}

export interface StreamEventTextStart {
  type: 'text-start';
  id: string;
}

export interface StreamEventTextDelta {
  type: 'text-delta';
  id: string;
  delta: string;
}

export interface StreamEventTextEnd {
  type: 'text-end';
  id: string;
}

export interface StreamEventData {
  type: 'data';
  data: {
    kind: 'chart' | 'insight' | 'top5';
    payload: any;
  };
}

export interface StreamEventDataChart {
  type: 'data-chart';
  data: string; // JSON stringified chart data
}

export interface StreamEventFinish {
  type: 'finish';
}

export interface StreamEventError {
  type: 'error';
  message: string;
}

export type StreamEvent =
  | StreamEventStart
  | StreamEventTextStart
  | StreamEventTextDelta
  | StreamEventTextEnd
  | StreamEventData
  | StreamEventDataChart
  | StreamEventFinish
  | StreamEventError;

/**
 * Delay configuration for different event types
 * Simulates realistic streaming speed
 */
export const STREAM_DELAYS = {
  'text-start': 10,      // Fast start
  'text-delta': [10, 30], // Variable delay 10-30ms per delta
  'text-end': 10,
  'data': [300, 1000],   // Slower data emission 300-1000ms
  'data-chart': [300, 1000], // Chart data takes time 300-1000ms
  'finish': 50,
} as const;

export type MockStreamVariant = 'basic' | 'multi' | 'edge' | 'empty';
