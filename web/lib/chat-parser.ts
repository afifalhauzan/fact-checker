import type { MetabotUIMessage } from '@/types/streaming'

/**
 * Backend chat history message schema
 */
interface BackendHistoryMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  meta_data?: Record<string, any> | null
  chart_data?: Record<string, any> | null
  created_at: string
}

/**
 * Backend chat history response schema
 */
interface BackendHistoryResponse {
  data: BackendHistoryMessage[]
}

/**
 * THIS IS A CUSTOM FUNCTION WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
 * Parse backend chat history response to frontend UI message format.
 * [SERVER-SIDE SOURCE OF TRUTH]
 * 
 * Transforms backend messages to Vercel AI SDK MetabotUIMessage format with parts array.
 * For assistant messages: includes text content + chart_data (if present) as data-chart parts.
 * Source of truth for chart history is now the backend API, not localStorage.
 * 
 * Backend chart structure: meta_data contains visual_config, chart_data contains { cols, rows }
 * Frontend expects: ChartEmbedData with id, metadata, visual_config, chart_data
 * 
 * @param rawData - Raw response from GET /api/chat/session/{conversation_id}/messages
 *   Can be either:
 *   - Array of BackendHistoryMessage (legacy format)
 *   - BackendHistoryResponse with { data } (current format)
 * @returns Array of frontend-compatible MetabotUIMessage objects with parts array for charts
 */
export function parseHistoryToMessages(rawData: unknown): MetabotUIMessage[] {
  // Handle both paginated response format and raw array format
  let messagesArray: BackendHistoryMessage[] = []
  
  if (!rawData) {
    console.warn('[ChatParser] Received null/undefined data')
    return []
  }

  // Check if response has data wrapper (new format)
  if (typeof rawData === 'object' && !Array.isArray(rawData) && 'data' in rawData) {
    const response = rawData as BackendHistoryResponse
    if (Array.isArray(response.data)) {
      messagesArray = response.data
    } else {
      console.warn('[ChatParser] Invalid response format - data is not an array:', rawData)
      return []
    }
  } 
  // Otherwise treat as direct array (legacy format)
  else if (Array.isArray(rawData)) {
    messagesArray = rawData
  } 
  // Invalid format
  else {
    console.warn('[ChatParser] Expected array or paginated response, received:', typeof rawData)
    return []
  }

  return messagesArray
    .map((item): MetabotUIMessage | null => {
      try {
        const message = item as BackendHistoryMessage

        // Validate required fields
        if (!message.id || !message.role) {
          console.warn('[ChatParser] Skipping invalid message:', message)
          return null
        }

        // Build parts array for Vercel AI SDK
        // Text content always included if present
        // Chart data included as data-chart type if present
        const parts: any[] = []
        
        if (message.content) {
          parts.push({ type: 'text', text: message.content })
        }
        
        // Reconstruct full ChartEmbedData from backend response
        // Backend stores: meta_data (visual_config) + chart_data (cols, rows) for charts
        // OR: meta_data (visual_config) + chart_data (type: 'dashboard', main_chart, ...) for dashboards
        if (message.chart_data && Object.keys(message.chart_data).length > 0) {
          try {
            // Check if this is dashboard data (has type: 'dashboard')
            const isDashboard = (message.chart_data as any)?.type === 'dashboard';
            
            if (isDashboard) {
              // Dashboard structure - chart_data already has all dashboard fields
              console.log('[ChatParser] Detected dashboard structure from backend');
              
              // For dashboards, use the chart structure as-is
              const dashboardChartData = message.chart_data as any;
              
              const fullChartData = {
                id: message.id,
                metadata: [], // Dashboards don't need metadata array (it's per-chart)
                visual_config: message.meta_data?.visual_config || {
                  chart_type: 'dashboard',
                  title: dashboardChartData.dashboard_title || 'Dashboard',
                },
                chart_data: dashboardChartData, // Full dashboard structure with type: 'dashboard'
              };
              
              // Add chart data part in AI SDK v5 format
              parts.push({
                type: 'data-chart',
                data: JSON.stringify(fullChartData)
              });

              console.log('[ChatParser] Reconstructed dashboard:', {
                id: fullChartData.id,
                dashboardTitle: dashboardChartData.dashboard_title,
                hasMainChart: !!dashboardChartData.main_chart,
                hasBreakdown: !!dashboardChartData.breakdown_chart,
                kpiCount: dashboardChartData.kpi_scorecards?.length || 0,
                insightsCount: dashboardChartData.ai_insights?.length || 0,
              });
            } else {
              // Regular chart structure - chart_data has cols, rows, metadata, and visual_config
              console.log('[ChatParser] Detected regular chart structure from backend');
              
              // Extract metadata from chart columns
              const metadata = (message.chart_data?.cols || []).map((col: any) => ({
                id: col.id ?? col.name,
                name: col.name,
                display_name: col.display_name || col.name,
                base_type: col.base_type || 'type/Text',
              }));

              // Extract visual_config from chart_data or fallback to meta_data
              const visualConfig = message.chart_data?.visual_config || message.meta_data?.visual_config || {
                chart_type: 'bar',
                title: 'Chart',
              };

              // Reconstruct the full chart structure
              const fullChartData = {
                id: message.chart_data?.id || message.id,
                metadata,
                visual_config: visualConfig,
                chart_data: {
                  cols: message.chart_data?.cols || [],
                  rows: message.chart_data?.rows || [],
                },
              };
              
              // Add chart data part in AI SDK v5 format
              parts.push({
                type: 'data-chart',
                data: JSON.stringify(fullChartData)
              });

              console.log('[ChatParser] Reconstructed chart:', {
                id: fullChartData.id,
                title: visualConfig.title,
                metadataCount: metadata.length,
                metadataNames: metadata.map((m: any) => m.name),
                hasChartData: !!fullChartData.chart_data,
                rows: fullChartData.chart_data?.rows?.length || 0,
              });
            }
          } catch (chartErr) {
            console.warn('[ChatParser] Failed to reconstruct chart data:', chartErr)
          }
        }

        // Ensure at least one text part
        if (parts.length === 0) {
          parts.push({ type: 'text', text: '' })
        }

        // Transform to frontend MetabotUIMessage format
        // Supports both user and assistant messages with chart restoration
        const uiMessage: MetabotUIMessage = {
          id: message.id,
          role: message.role, // 'user' or 'assistant'
          parts,
        }

        // console.log('[ChatParser] Parsed message:', {
        //   id: message.id,
        //   role: message.role,
        //   hasContent: !!message.content,
        //   hasChartData: !!message.chart_data,
        //   partsCount: parts.length,
        // })

        return uiMessage
      } catch (err) {
        console.error('[ChatParser] Error parsing message:', err, item)
        return null
      }
    })
    .filter((msg): msg is MetabotUIMessage => msg !== null)
}
