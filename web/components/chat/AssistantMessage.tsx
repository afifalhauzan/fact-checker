import React from 'react';
import { type MetabotUIMessage, type MetabotUIMessagePart } from "@/types/streaming";
import { Check, Copy, ChevronDown } from "lucide-react";
import { PreviewMessage } from "@/components/message";
import { useInteractionStore } from "@/lib/interaction-store";
import {
  AnalysisSchema,
  type AnalysisResult,
  type Claim,
  type Risk,
  type Reference,
  type Reasoning,
} from "@/langchain/agents/analyzer/schema";
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

interface SectionalAnalysisData {
  summary?: string;
  claims?: Claim[];
  risks?: Risk[];
  explanation?: string;
  references?: Reference[];
  suggestedQuestions?: string[];
  reasoning?: Reasoning[];
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

function extractSectionalDataFromParts(parts: MetabotUIMessagePart[]): SectionalAnalysisData {
  const sectionalData: SectionalAnalysisData = {};

  for (const part of parts) {
    if (part.type === "data-summary") {
      sectionalData.summary = part.data;
    } else if (part.type === "data-claims") {
      sectionalData.claims = part.data;
    } else if (part.type === "data-risks") {
      sectionalData.risks = part.data;
    } else if (part.type === "data-explanation") {
      sectionalData.explanation = part.data;
    } else if (part.type === "data-references") {
      sectionalData.references = part.data;
    } else if (part.type === "data-suggested-questions") {
      sectionalData.suggestedQuestions = part.data;
    } else if (part.type === "data-reasoning") {
      sectionalData.reasoning = part.data;
    }
  }

  return sectionalData;
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

  const sectionalData = React.useMemo(() => {
    if (!message.parts || !Array.isArray(message.parts)) {
      return {};
    }

    return extractSectionalDataFromParts(message.parts as MetabotUIMessagePart[]);
  }, [message.parts]);

  const hasSectionalParts = React.useMemo(() => {
    if (!message.parts || !Array.isArray(message.parts)) {
      return false;
    }

    return (message.parts as MetabotUIMessagePart[]).some(
      (part) =>
        part.type === "data-summary" ||
        part.type === "data-claims" ||
        part.type === "data-risks" ||
        part.type === "data-explanation" ||
        part.type === "data-references" ||
        part.type === "data-suggested-questions" ||
        part.type === "data-reasoning"
    );
  }, [message.parts]);

  const resolvedReasoning = hasSectionalParts ? sectionalData.reasoning : analysisData?.reasoning;
  const resolvedSummary = hasSectionalParts ? sectionalData.summary : analysisData?.summary;
  const resolvedClaims = hasSectionalParts ? sectionalData.claims : analysisData?.claims;
  const resolvedRisks = hasSectionalParts ? sectionalData.risks : analysisData?.risks;
  const resolvedExplanation = hasSectionalParts ? sectionalData.explanation : analysisData?.explanation;
  const resolvedReferences = hasSectionalParts ? sectionalData.references : analysisData?.references;
  const resolvedSuggestedQuestions = hasSectionalParts ? sectionalData.suggestedQuestions : analysisData?.suggestedQuestions;

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

  const hasAnyAnalysisSection = Boolean(
    resolvedSummary || resolvedClaims || resolvedRisks || resolvedExplanation || resolvedReferences || resolvedSuggestedQuestions
  );
  const hasConversationTextStarted = React.useMemo(() => {
    if (!message.parts || !Array.isArray(message.parts)) {
      return false;
    }

    return (message.parts as MetabotUIMessagePart[]).some(
      (part) => part.type === "text" && part.text.trim().length > 0
    );
  }, [message.parts]);

  const shouldOpenReasoning =
    isCurrentlyStreaming &&
    !!(resolvedReasoning && resolvedReasoning.length > 0) &&
    !hasConversationTextStarted;

  return (
    <div className={`flex gap-2 items-end group ${shouldAnimate ? 'animate-in slide-in-from-left-2 duration-300' : ''
      } ${isHighlighted ? 'message-highlight-container' : ''
      }`}>
      <div className="w-full md:max-w-full relative">
        <div className={`min-w-20 rounded-xl rounded-bl-sm pl-0 py-0 text-sm leading-relaxed text-foreground ${isHighlighted ? 'message-highlight' : ''
          }`}>

          {resolvedReasoning && resolvedReasoning.length > 0 && (
            <details className="rounded-lg bg-card py-2 group max-w-md" open={shouldOpenReasoning}>
              <summary className="flex cursor-pointer list-none items-center justify-start gap-2 text-xs font-medium text-foreground px-1">
                <span>{isCurrentlyStreaming ? "Sedang berpikir..." : "Tampilkan alur berpikir"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="mt-3 ml-1 pl-3 border-l border-gray-300 space-y-1.5 text-xs">
                <p className="pl-2 text-muted-foreground italic">{resolvedReasoning[0].intent}</p>
                <ul className="space-y-1 pl-4">
                  {resolvedReasoning[0].steps.map((step, index) => (
                    <li key={`${message.id}-reasoning-step-${index}`} className="text-muted-foreground flex gap-1.5">
                      <span className="text-primary font-semibold flex-shrink-0">-&gt;</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
                {isCurrentlyStreaming && (
                  <div className="pt-1 pl-2 text-[11px] text-muted-foreground animate-pulse">Thinking...</div>
                )}
              </div>
            </details>
          )}

          <PreviewMessage
            chatId={chatId}
            message={message}
            isLoading={isCurrentlyStreaming}
            completedStepSelections={completedStepSelections}
            onInteractiveChoice={onInteractiveChoice}
          />

          {hasAnyAnalysisSection && (
            <div className="mt-3 space-y-3 animate-in fade-in-0 duration-300">
              {resolvedSummary?.trim().length > 0 && (
                <SummaryCard summary={resolvedSummary} />
              )}

              {resolvedClaims?.length > 0 && (
                <section className="space-y-2">
                  {resolvedClaims.map((claim, index) => (
                    <ClaimCard
                      key={`${message.id}-claim-${index}`}
                      text={claim.text}
                      confidence={claim.confidence}
                    />
                  ))}
                </section>
              )}

              {resolvedRisks?.length > 0 && (
                <section className="space-y-2">
                  {resolvedRisks.map((risk, index) => (
                    <RiskCard
                      key={`${message.id}-risk-${index}`}
                      type={risk.type}
                      description={risk.description}
                    />
                  ))}
                </section>
              )}

              {resolvedExplanation?.trim().length > 0 && (
                <ExplanationCard explanation={resolvedExplanation} />
              )}

              {resolvedReferences?.length > 0 && (
                <details className="rounded-xl border border-border bg-card p-3 group">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
                    <span>Referensi</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 border-t border-border pt-3 space-y-2">
                    {resolvedReferences.map((ref, index) => (
                      <div key={`${message.id}-reference-${index}`} className="text-xs">
                        <p className="font-semibold text-foreground">{ref.title}</p>
                        {ref.snippet && (
                          <p className="mt-1 leading-relaxed text-muted-foreground italic">{ref.snippet}</p>
                        )}
                        {ref.url && (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex text-primary hover:underline"
                          >
                            View source -&gt;
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {resolvedSuggestedQuestions?.length > 0 && (
                <SuggestionQuestions
                  messageId={message.id}
                  questions={resolvedSuggestedQuestions}
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
