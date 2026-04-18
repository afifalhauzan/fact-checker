/**
 * Mock Stream Runner and Scenarios
 * Simulates backend SSE streaming behavior for development
 */

import type { Dispatch, SetStateAction } from 'react';
import {
    StreamEvent,
    STREAM_DELAYS,
    MockStreamVariant
} from '@/types/mock-stream';
import type { MetabotUIMessage } from '@/types/streaming';
import type { ChartEmbedData } from '@/types/chart';

/**
 * Delay utility with optional range
 */
const delay = (ms: number | [number, number]): Promise<void> => {
    const actualDelay = Array.isArray(ms)
        ? Math.random() * (ms[1] - ms[0]) + ms[0]
        : ms;
    return new Promise(resolve => setTimeout(resolve, actualDelay));
};

/**
 * THIS IS A CUSTOM FUNCTION WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
 * Run mock stream events sequentially
 * Emits events over time to simulate real streaming
 * 
 * @param events - Array of stream events to emit
 * @param onEvent - Callback for each emitted event
 * @param speedMultiplier - Multiplier for all delays (0.5 = 2x speed, 2 = half speed)
 */
export async function runMockStream(
    events: StreamEvent[],
    onEvent: (event: StreamEvent) => void,
    speedMultiplier: number = 1
): Promise<void> {
    console.log('[MockStream] Starting stream with', events.length, 'events');

    for (let i = 0; i < events.length; i++) {
        const event = events[i];

        // Emit the event
        onEvent(event);
        console.log('[MockStream] Emitted event:', event.type, event);

        // Calculate delay before next event
        let eventDelay: number | [number, number] | null = null;
        if (event.type === 'text-start') {
            eventDelay = STREAM_DELAYS['text-start'];
        } else if (event.type === 'text-delta') {
            eventDelay = STREAM_DELAYS['text-delta'] as [number, number];
        } else if (event.type === 'text-end') {
            eventDelay = STREAM_DELAYS['text-end'];
        } else if (event.type === 'data') {
            eventDelay = STREAM_DELAYS['data'] as [number, number];
        } else if (event.type === 'data-chart') {
            eventDelay = STREAM_DELAYS['data-chart'] as [number, number];
        } else if (event.type === 'finish') {
            eventDelay = STREAM_DELAYS['finish'];
        }

        // Apply speed multiplier and delay
        if (eventDelay !== null && i < events.length - 1) {
            await delay(Array.isArray(eventDelay)
                ? [eventDelay[0] * speedMultiplier, eventDelay[1] * speedMultiplier]
                : (eventDelay as number) * speedMultiplier
            );
        }
    }

    console.log('[MockStream] Stream completed');
}

interface AgenticMockSequenceOptions {
    setMessages: Dispatch<SetStateAction<MetabotUIMessage[]>>;
    waitForUserSelection: (stepId: string) => Promise<string>;
    onPromptReady?: () => void;
    speedMultiplier?: number;
}

const buildAgenticFollowUpChart = (segmentSelection: string, timeframeSelection: string): ChartEmbedData => {
    const segmentBase = segmentSelection.toLowerCase();
    const timeframeBase = timeframeSelection.toLowerCase();

    const baseBySegment = segmentBase.includes('enterprise')
        ? 92
        : segmentBase.includes('mid')
            ? 78
            : 64;

    const timeframeFactor = timeframeBase.includes('annual')
        ? 1.15
        : timeframeBase.includes('quarterly')
            ? 1.0
            : 0.9;

    const adjustedBase = Math.round(baseBySegment * timeframeFactor);

    return {
        id: `agentic-chart-${segmentBase.replace(/[^a-z0-9]+/g, '-')}-${timeframeBase.replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        metadata: [
            {
                id: 1,
                name: 'stage',
                display_name: 'Sales Stage',
                base_type: 'type/Text',
            },
            {
                id: 2,
                name: 'score',
                display_name: 'Opportunity Score',
                base_type: 'type/Integer',
            },
        ],
        visual_config: {
            chart_type: 'bar',
            title: `Agentic Sales Snapshot - ${segmentSelection} (${timeframeSelection})`,
            x_axis: 'Stage',
            y_axis: 'Score',
            format: 'number',
        },
        cols: [
            {
                name: 'stage',
                display_name: 'Sales Stage',
                base_type: 'type/Text',
            },
            {
                name: 'score',
                display_name: 'Opportunity Score',
                base_type: 'type/Integer',
            },
        ],
        rows: [
            ['Prospecting', Math.max(adjustedBase - 20, 10)],
            ['Discovery', Math.max(adjustedBase - 8, 20)],
            ['Proposal', Math.max(adjustedBase + 4, 30)],
            ['Closed Won', adjustedBase],
        ],
    };
};

/**
 * THIS IS A CUSTOM FUNCTION WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
 * Run the agentic mock loop used for the HITL sales demo.
 */
export async function runAgenticMockSequence({
    setMessages,
    waitForUserSelection,
    onPromptReady,
    speedMultiplier = 1,
}: AgenticMockSequenceOptions): Promise<void> {
    const stepSegmentId = `agentic-step-segment-${Date.now()}`;
    const stepTimeframeId = `agentic-step-timeframe-${Date.now()}`;
    const segmentPromptMessageId = `assistant-agentic-segment-${Date.now()}`;

    const segmentQuestion = 'Fokus pada segmen mana?';
    const segmentOptions = ['SMB', 'Mid-Market', 'Enterprise'];
    const timeframeQuestion = 'Pilih rentang waktu untuk analisis';
    const timeframeOptions = ['Per Bulan', 'Per Kuartal', 'Per Tahun'];

    // Simulate a short think-time before revealing the interactive step.
    await delay(600 * speedMultiplier);

    setMessages((prev) => [
        ...prev,
        {
            id: segmentPromptMessageId,
            role: 'assistant',
            parts: [
                {
                    type: 'text',
                    text: 'Saya bisa memandu demo penjualan ini secara interaktif. Pilih segmen terlebih dahulu.',
                },
                {
                    type: 'interactive-step',
                    data: {
                        stepId: stepSegmentId,
                        question: segmentQuestion,
                        options: segmentOptions,
                    },
                },
            ],
        },
    ]);

    onPromptReady?.();

    const segmentSelection = await waitForUserSelection(stepSegmentId);

    await delay(300 * speedMultiplier);

    const timeframePromptMessageId = `assistant-agentic-timeframe-${Date.now()}`;
    setMessages((prev) => [
        ...prev,
        {
            id: timeframePromptMessageId,
            role: 'assistant',
            parts: [
                {
                    type: 'choice-summary',
                    data: {
                        stepId: stepSegmentId,
                        selection: segmentSelection,
                    },
                },
                {
                    type: 'text',
                    text: `Baik, fokus segmen ${segmentSelection}. Sekarang pilih rentang waktu.`,
                },
                {
                    type: 'interactive-step',
                    data: {
                        stepId: stepTimeframeId,
                        question: timeframeQuestion,
                        options: timeframeOptions,
                    },
                },
            ],
        },
    ]);

    const timeframeSelection = await waitForUserSelection(stepTimeframeId);

    await delay(300 * speedMultiplier);

    const finalChart = buildAgenticFollowUpChart(segmentSelection, timeframeSelection);
    const finalMessageId = `assistant-agentic-followup-${Date.now()}`;
    const followUpText = `Berikut dashboard penjualan ${segmentSelection} dengan horizon ${timeframeSelection} yang paling relevan untuk konteks ini.`;

    setMessages((prev) => [
        ...prev,
        {
            id: finalMessageId,
            role: 'assistant',
            parts: [
                {
                    type: 'choice-summary',
                    data: {
                        stepId: stepTimeframeId,
                        selection: timeframeSelection,
                    },
                },
                {
                    type: 'text',
                    text: '',
                },
                {
                    type: 'data-chart',
                    data: JSON.stringify(finalChart),
                },
            ],
        },
    ]);

    let currentText = '';
    for (const char of followUpText) {
        currentText += char;

        setMessages((prev) => {
            const next = [...prev];
            const targetIndex = next.findIndex((msg) => msg.id === finalMessageId);
            if (targetIndex === -1) {
                return prev;
            }

            const targetMessage = next[targetIndex];
            const parts = [...targetMessage.parts];
            const textPartIndex = parts.findIndex((part) => part.type === 'text');
            if (textPartIndex !== -1) {
                parts[textPartIndex] = {
                    type: 'text',
                    text: currentText,
                };
            }

            next[targetIndex] = {
                ...targetMessage,
                parts,
            };

            return next;
        });

        await delay(5 * speedMultiplier);
    }
}

/**
 * Mock chart data for scenarios
 */
const MOCK_CHART_BASIC = {
    id: 'chart-eb0590c24b0345498e0f463855a655b5',
    metadata: [
        {
            id: 13,
            name: 'CREATED_AT',
            display_name: 'Created At: Month',
            base_type: 'type/DateTime',
        },
        {
            id: null,
            name: 'sum',
            display_name: 'Sum of Subtotal',
            base_type: 'type/Float',
        },
    ],
    visual_config: {
        chart_type: 'area',
        title: 'Total Penjualan per Bulan Tahun 2025',
        x_axis: 'Bulan',
        y_axis: 'Total Penjualan',
        format: 'currency',
    },
    cols: [
        {
            name: 'CREATED_AT',
            display_name: 'Created At: Month',
            base_type: 'type/DateTime',
        },
        {
            name: 'sum',
            display_name: 'Sum of Subtotal',
            base_type: 'type/Float',
        },
    ],
    rows: [
        ['2025-01-01T00:00:00Z', 49436.66806086141],
        ['2025-02-01T00:00:00Z', 45101.08954034002],
        ['2025-03-01T00:00:00Z', 49293.82118137571],
        ['2025-04-01T00:00:00Z', 45535.79215588472],
        ['2025-05-01T00:00:00Z', 45763.581549961986],
        ['2025-06-01T00:00:00Z', 44689.34748926272],
        ['2025-07-01T00:00:00Z', 46111.9136874956],
        ['2025-08-01T00:00:00Z', 48418.60958017262],
        ['2025-09-01T00:00:00Z', 42785.017676314215],
        ['2025-10-01T00:00:00Z', 44263.66304780227],
        ['2025-11-01T00:00:00Z', 45444.068114669484],
        ['2025-12-01T00:00:00Z', 46201.074486975],
    ],
};

const MOCK_CHART_BAR = {
    id: 'chart-002',
    metadata: [
        {
            id: 14,
            name: 'CATEGORY',
            display_name: 'Category',
            base_type: 'type/Text',
        },
        {
            id: null,
            name: 'count',
            display_name: 'Count of Orders',
            base_type: 'type/Integer',
        },
    ],
    visual_config: {
        chart_type: 'bar',
        title: 'Orders by Category',
        x_axis: 'Category',
        y_axis: 'Count',
        format: 'number',
    },
    cols: [
        {
            name: 'CATEGORY',
            display_name: 'Category',
            base_type: 'type/Text',
        },
        {
            name: 'count',
            display_name: 'Count of Orders',
            base_type: 'type/Integer',
        },
    ],
    rows: [
        ['Electronics', 245],
        ['Clothing', 189],
        ['Home & Garden', 156],
        ['Sports', 132],
        ['Books', 98],
    ],
};

/**
 * Mock Stream Scenarios
 */

/**
 * Scenario 1: Basic text + single chart
 * Simple conversation response with visualization
 */
export const MOCK_STREAM_BASIC: StreamEvent[] = [
    { type: 'start', messageId: 'msg-003' },
    { type: 'text-start', id: 'text-003' },
    { type: 'text-delta', id: 'text-003', delta: 'Based ' },
    { type: 'text-delta', id: 'text-003', delta: 'on ' },
    { type: 'text-delta', id: 'text-003', delta: 'your ' },
    { type: 'text-delta', id: 'text-003', delta: 'recent ' },
    { type: 'text-delta', id: 'text-003', delta: 'sales ' },
    { type: 'text-delta', id: 'text-003', delta: 'data, ' },
    { type: 'text-delta', id: 'text-003', delta: 'there’s ' },
    { type: 'text-delta', id: 'text-003', delta: 'a ' },
    { type: 'text-delta', id: 'text-003', delta: 'noticeable ' },
    { type: 'text-delta', id: 'text-003', delta: 'upward ' },
    { type: 'text-delta', id: 'text-003', delta: 'trend ' },
    { type: 'text-delta', id: 'text-003', delta: 'starting ' },
    { type: 'text-delta', id: 'text-003', delta: 'in ' },
    { type: 'text-delta', id: 'text-003', delta: 'late ' },
    { type: 'text-delta', id: 'text-003', delta: 'Q2. ' },
    { type: 'text-delta', id: 'text-003', delta: 'The ' },
    { type: 'text-delta', id: 'text-003', delta: 'increase ' },
    { type: 'text-delta', id: 'text-003', delta: 'seems ' },
    { type: 'text-delta', id: 'text-003', delta: 'to ' },
    { type: 'text-delta', id: 'text-003', delta: 'be ' },
    { type: 'text-delta', id: 'text-003', delta: 'driven ' },
    { type: 'text-delta', id: 'text-003', delta: 'primarily ' },
    { type: 'text-delta', id: 'text-003', delta: 'by ' },
    { type: 'text-delta', id: 'text-003', delta: 'returning ' },
    { type: 'text-delta', id: 'text-003', delta: 'customers ' },
    { type: 'text-delta', id: 'text-003', delta: 'rather ' },
    { type: 'text-delta', id: 'text-003', delta: 'than ' },
    { type: 'text-delta', id: 'text-003', delta: 'new ' },
    { type: 'text-delta', id: 'text-003', delta: 'acquisitions, ' },
    { type: 'text-delta', id: 'text-003', delta: 'which ' },
    { type: 'text-delta', id: 'text-003', delta: 'suggests ' },
    { type: 'text-delta', id: 'text-003', delta: 'your ' },
    { type: 'text-delta', id: 'text-003', delta: 'retention ' },
    { type: 'text-delta', id: 'text-003', delta: 'strategy ' },
    { type: 'text-delta', id: 'text-003', delta: 'is ' },
    { type: 'text-delta', id: 'text-003', delta: 'beginning ' },
    { type: 'text-delta', id: 'text-003', delta: 'to ' },
    { type: 'text-delta', id: 'text-003', delta: 'take ' },
    { type: 'text-delta', id: 'text-003', delta: 'effect. ' },
    { type: 'text-delta', id: 'text-003', delta: 'If ' },
    { type: 'text-delta', id: 'text-003', delta: 'this ' },
    { type: 'text-delta', id: 'text-003', delta: 'pattern ' },
    { type: 'text-delta', id: 'text-003', delta: 'continues, ' },
    { type: 'text-delta', id: 'text-003', delta: 'you ' },
    { type: 'text-delta', id: 'text-003', delta: 'might ' },
    { type: 'text-delta', id: 'text-003', delta: 'want ' },
    { type: 'text-delta', id: 'text-003', delta: 'to ' },
    { type: 'text-delta', id: 'text-003', delta: 'focus ' },
    { type: 'text-delta', id: 'text-003', delta: 'more ' },
    { type: 'text-delta', id: 'text-003', delta: 'on ' },
    { type: 'text-delta', id: 'text-003', delta: 'loyalty-driven ' },
    { type: 'text-delta', id: 'text-003', delta: 'campaigns ' },
    { type: 'text-delta', id: 'text-003', delta: 'rather ' },
    { type: 'text-delta', id: 'text-003', delta: 'than ' },
    { type: 'text-delta', id: 'text-003', delta: 'purely ' },
    { type: 'text-delta', id: 'text-003', delta: 'acquisition-based ' },
    { type: 'text-delta', id: 'text-003', delta: 'efforts.' },
    // Chart comes here (right before text-end)
    { type: 'data-chart', data: JSON.stringify(MOCK_CHART_BASIC) },
    { type: 'text-end', id: 'text-001' },
    { type: 'finish' },
];

/**
 * Scenario 2: Multi-part response
 * Text + chart + insight + top5
 */
export const MOCK_STREAM_MULTI: StreamEvent[] = [
    { type: 'start', messageId: 'msg-002' },
    { type: 'text-start', id: 'text-002' },
    { type: 'text-delta', id: 'text-002', delta: 'Analisis mendalam kategori penjualan berdasarkan' },
    { type: 'text-delta', id: 'text-002', delta: ' data terbaru. Berikut visualisasi utama:' },
    // First chart (as JSON string)
    { type: 'data-chart', data: JSON.stringify(MOCK_CHART_BAR) },
    { type: 'text-end', id: 'text-002' },
    { type: 'finish' },
];

/**
 * Scenario 3: Edge case - delayed chart, multiple interleaved
 * Tests proper handling of out-of-order or delayed data
 */
export const MOCK_STREAM_EDGE: StreamEvent[] = [
    { type: 'start', messageId: 'msg-003' },
    { type: 'text-start', id: 'text-003' },
    { type: 'text-delta', id: 'text-003', delta: 'Memproses data kompleks...' },
    { type: 'text-delta', id: 'text-003', delta: ' tunggu sebentar.' },
    // First chart (as JSON string)
    { type: 'data-chart', data: JSON.stringify(MOCK_CHART_BASIC) },
    // More text
    { type: 'text-delta', id: 'text-003', delta: ' Sekarang menampilkan kategori.' },
    // Second chart (as JSON string)
    { type: 'data-chart', data: JSON.stringify(MOCK_CHART_BAR) },
    { type: 'text-end', id: 'text-003' },
    { type: 'finish' },
];

/**
 * Scenario 4: Empty response
 * Just user acknowledgement, no data
 */
export const MOCK_STREAM_EMPTY: StreamEvent[] = [
    { type: 'start', messageId: 'msg-004' },
    { type: 'text-start', id: 'text-004' },
    { type: 'text-delta', id: 'text-004', delta: 'Baik, saya memahami.' },
    { type: 'text-delta', id: 'text-004', delta: ' Apa lagi yang bisa saya bantu?' },
    { type: 'text-end', id: 'text-004' },
    { type: 'finish' },
];

/**
 * THIS IS A CUSTOM FUNCTION WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
 * Get mock stream by variant name
 */
export function getMockStreamVariant(variant: MockStreamVariant): StreamEvent[] {
    switch (variant) {
        case 'basic':
            return MOCK_STREAM_BASIC;
        case 'multi':
            return MOCK_STREAM_MULTI;
        case 'edge':
            return MOCK_STREAM_EDGE;
        case 'empty':
            return MOCK_STREAM_EMPTY;
        default:
            return MOCK_STREAM_BASIC;
    }
}

/**
 * THIS IS A CUSTOM FUNCTION WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
 * Dev-only logging for mock events
 */
export function logMockEvent(event: StreamEvent): void {
    if (process.env.NODE_ENV === 'development') {
        console.group(`[MockStream] ${event.type}`);
        console.log(event);
        console.groupEnd();
    }
}
