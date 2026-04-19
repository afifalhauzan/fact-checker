import React from 'react';
import { type MetabotUIMessage, type MetabotUIMessagePart } from "@/types/streaming";
import { Check, Copy } from "lucide-react";
import { PreviewMessage } from "@/components/message";
import { useInteractionStore } from "@/lib/interaction-store";
import { AnalysisSchema, type AnalysisResult } from "@/langchain/agents/analyzer/schema";
import { SummaryCard } from "@/components/cards/SummaryCard";
import { ClaimCard } from "@/components/cards/ClaimCard";
import { RiskCard } from "@/components/cards/RiskCard";
import { SuggestionQuestions } from "@/components/cards/SuggestionQuestions";
import { ExplanationCard } from "@/components/cards/ExplanationCard";

interface AssistantMessageProps {
  message: MetabotUIMessage;
  chatId: string;
  isStreaming: boolean;
  isLastMessage: boolean;
  completedStepSelections: Map<string, string>;
  onInteractiveChoice: (stepId: string, option: string) => void | Promise<void>;
}

function extractAnalysisFromParts(parts: MetabotUIMessagePart[]): AnalysisResult | null {
  const analysisPart = parts.find((part) => part.type === 'data-analysis');

  if (!analysisPart || analysisPart.type !== 'data-analysis' || !analysisPart.data) {
    return null;
  }

  try {
    const parsed = typeof analysisPart.data === 'string'
      ? JSON.parse(analysisPart.data)
      : analysisPart.data;

    const validation = AnalysisSchema.safeParse(parsed);
    return validation.success ? validation.data : null;
  } catch {
    return null;
  }
}

export function AssistantMessage({ 
  message, 
  chatId, 
  isStreaming,
  isLastMessage,
  completedStepSelections,
  onInteractiveChoice,
}: AssistantMessageProps) {
  const isCurrentlyStreaming = isStreaming && isLastMessage;
  const { targetMessageId } = useInteractionStore();
  const isHighlighted = targetMessageId === message.id;
  
  // Copy state
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null);
  
  // Only apply entrance animation on first mount, not on highlight changes
  const mountedRef = React.useRef(true);
  const shouldAnimate = mountedRef.current;
  
  React.useEffect(() => {
    mountedRef.current = false;
  }, []);

  // Check if message has interactive steps
  const hasInteractiveSteps = React.useMemo(() => {
    if (!message.parts || !Array.isArray(message.parts)) return false;
    return (message.parts as MetabotUIMessagePart[]).some(
      (part) => part.type === 'interactive-step'
    );
  }, [message.parts]);

  const analysisData = React.useMemo(() => {
    if (!message.parts || !Array.isArray(message.parts)) {
      return null;
    }

    return extractAnalysisFromParts(message.parts as MetabotUIMessagePart[]);
  }, [message.parts]);

  // Extract text content for copying
  const getMessageContent = (): string => {
    if (!message.parts || !Array.isArray(message.parts)) return '';
    
    return (message.parts as MetabotUIMessagePart[])
      .filter((part) => part.type === 'text')
      .map((part) => (part.type === 'text' ? part.text : ''))
      .join('\n\n');
  };

  // Handle copy message
  const handleCopyMessage = async () => {
    const content = getMessageContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(message.id);
      console.log('Message copied to clipboard');

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className={`flex gap-2 items-end group ${
      shouldAnimate ? 'animate-in slide-in-from-left-2 duration-300' : ''
    } ${
      isHighlighted ? 'message-highlight-container' : ''
    }`}>
      <div className="w-full md:max-w-full relative">
        <div className={`min-w-20 rounded-xl rounded-bl-sm pl-0 py-0 text-sm leading-relaxed text-foreground ${
          isHighlighted ? 'message-highlight' : ''
        }`}>
          <PreviewMessage
            chatId={chatId}
            message={message}
            isLoading={isCurrentlyStreaming}
            completedStepSelections={completedStepSelections}
            onInteractiveChoice={onInteractiveChoice}
          />

          {analysisData && (
            <div className="mt-3 space-y-3 animate-in fade-in-0 duration-300">
              {analysisData.summary?.trim().length > 0 && (
                <SummaryCard summary={analysisData.summary} />
              )}

              {analysisData.claims?.length > 0 && (
                <section className="space-y-2">
                  {analysisData.claims.map((claim, index) => (
                    <ClaimCard
                      key={`${message.id}-claim-${index}`}
                      text={claim.text}
                      confidence={claim.confidence}
                    />
                  ))}
                </section>
              )}

              {analysisData.risks?.length > 0 && (
                <section className="space-y-2">
                  {analysisData.risks.map((risk, index) => (
                    <RiskCard
                      key={`${message.id}-risk-${index}`}
                      type={risk.type}
                      description={risk.description}
                    />
                  ))}
                </section>
              )}

              {analysisData.explanation?.trim().length > 0 && (
                <ExplanationCard explanation={analysisData.explanation} />
              )}

              {analysisData.suggestedQuestions?.length > 0 && (
                <SuggestionQuestions
                  messageId={message.id}
                  questions={analysisData.suggestedQuestions}
                />
              )}
            </div>
          )}
        </div>

        {/* Copy button - appears on hover only after streaming is complete, and disabled for interactive steps */}
        {!isCurrentlyStreaming && !hasInteractiveSteps && (
          <button
            onClick={handleCopyMessage}
            className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-card rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title={copiedMessageId === message.id ? "Copied!" : "Copy message"}
          >
            {copiedMessageId === message.id ? (
              <>
                <Check className="w-3 h-3 inline mr-1 text-green-600" />
                <span className="text-green-600">Disalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 inline mr-1" />
                Salin
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}