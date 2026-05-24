import React from "react";
import { type MetabotUIMessage, type MetabotUIMessagePart, type SummaryPartData } from "@/types/streaming";
import { Check, ChevronDown, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { PreviewMessage } from "@/components/message";
import { useInteractionStore } from "@/lib/interaction-store";
import {
  AnalysisSchema,
  type AnalysisResult,
  type Citation,
  type Claim,
  type ExplanationItem,
  type Reference,
  type Reasoning,
  type Risk,
} from "@/langchain/agents/analyzer/schema";
import { SummaryCard } from "@/components/cards/SummaryCard";
import { ClaimCard } from "@/components/cards/ClaimCard";
import { RiskCard } from "@/components/cards/RiskCard";
import { SuggestionQuestions } from "@/components/cards/SuggestionQuestions";
import { ExplanationCard } from "@/components/cards/ExplanationCard";
import { ReferenceCard } from "@/components/cards/ReferenceCard";
import { ReasoningComponent } from "@/components/cards/ReasoningComponent";
import { AnalysisActions } from "@/components/cards/AnalysisActions";
import { ActionInsightCard } from "@/components/cards/ActionInsightCard";
import type { AnalysisAction, UIActionId } from "@/types/ui-actions";

interface AssistantMessageProps {
  message: MetabotUIMessage;
  chatId: string;
  isStreaming: boolean;
  isLastMessage: boolean;
  completedStepSelections: Map<string, string>;
  onInteractiveChoice: (stepId: string, option: string) => void | Promise<void>;
  onSuggestionClick: (suggestion: string) => void;
  onActionClick: (action: AnalysisAction, sourceMessageId?: string) => void;
  pendingActionId?: UIActionId | null;
  isActionLoading?: boolean;
}

interface SectionalAnalysisData {
  summary?: SummaryPartData;
  claims?: Claim[];
  risks?: Risk[];
  explanations?: ExplanationItem[];
  references?: Reference[];
  actions?: AnalysisAction[];
  actionInsight?: {
    actionId: UIActionId;
    title: string;
    points: string[];
  };
  suggestedQuestions?: string[];
  reasoning?: Reasoning[];
}

type RenderItem =
  | { kind: "preview-full"; key: string }
  | { kind: "preview-part"; key: string; part: MetabotUIMessagePart; partIndex: number }
  | { kind: "reasoning"; key: string; reasoning: Reasoning[] }
  | { kind: "summary"; key: string; summary: string; citations: Citation[] }
  | { kind: "claims"; key: string; claims: Claim[] }
  | { kind: "risks"; key: string; risks: Risk[] }
  | { kind: "explanations"; key: string; explanations: ExplanationItem[] }
  | { kind: "references"; key: string; references: Reference[] }
  | { kind: "actions"; key: string; actions: AnalysisAction[] }
  | {
      kind: "action-insight";
      key: string;
      actionInsight: {
        actionId: UIActionId;
        title: string;
        points: string[];
      };
    }
  | { kind: "suggested-questions"; key: string; questions: string[] };

function extractAnalysisFromParts(parts: MetabotUIMessagePart[]): AnalysisResult | null {
  const analysisPart = parts.find((part) => part.type === "data-analysis");

  if (!analysisPart || analysisPart.type !== "data-analysis" || !analysisPart.data) {
    return null;
  }

  try {
    const parsed = typeof analysisPart.data === "string" ? JSON.parse(analysisPart.data) : analysisPart.data;
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
      sectionalData.summary = typeof part.data === "string"
        ? { text: part.data, citations: [] }
        : { text: part.data.text, citations: part.data.citations ?? [] };
    } else if (part.type === "data-claims") {
      sectionalData.claims = part.data;
    } else if (part.type === "data-risks") {
      sectionalData.risks = part.data;
    } else if (part.type === "data-explanation") {
      sectionalData.explanations = part.data;
    } else if (part.type === "data-references") {
      sectionalData.references = part.data;
    } else if (part.type === "data-actions") {
      sectionalData.actions = part.data.actions;
    } else if (part.type === "data-action-insight") {
      sectionalData.actionInsight = part.data;
    } else if (part.type === "data-suggested-questions") {
      sectionalData.suggestedQuestions = part.data;
    } else if (part.type === "data-reasoning") {
      sectionalData.reasoning = part.data;
    }
  }

  return sectionalData;
}

function hasInterleavableDataPart(part: MetabotUIMessagePart): boolean {
  return (
    part.type === "data-summary" ||
    part.type === "data-claims" ||
    part.type === "data-risks" ||
    part.type === "data-explanation" ||
    part.type === "data-references" ||
    part.type === "data-actions" ||
    part.type === "data-action-insight" ||
    part.type === "data-suggested-questions" ||
    part.type === "data-reasoning"
  );
}

export function AssistantMessage({
  message,
  chatId,
  isStreaming,
  isLastMessage,
  completedStepSelections,
  onInteractiveChoice,
  onSuggestionClick,
  onActionClick,
  pendingActionId = null,
  isActionLoading = false,
}: AssistantMessageProps) {
  const fadeUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.24, ease: "easeOut" as const },
  };

  const isCurrentlyStreaming = isStreaming && isLastMessage;
  const { targetMessageId } = useInteractionStore();
  const isHighlighted = targetMessageId === message.id;

  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null);

  const mountedRef = React.useRef(true);
  const shouldAnimate = mountedRef.current;

  React.useEffect(() => {
    mountedRef.current = false;
  }, []);

  const parts = React.useMemo(() => ((message.parts || []) as MetabotUIMessagePart[]), [message.parts]);

  const hasInteractiveSteps = React.useMemo(
    () => parts.some((part) => part.type === "interactive-step"),
    [parts]
  );

  const analysisData = React.useMemo(() => extractAnalysisFromParts(parts), [parts]);
  const sectionalData = React.useMemo(() => extractSectionalDataFromParts(parts), [parts]);

  const hasInterleavedFlow = React.useMemo(
    () => parts.some((part) => hasInterleavableDataPart(part) && part.type !== "data-analysis"),
    [parts]
  );

  const availableReasoning = React.useMemo(() => {
    if (hasInterleavedFlow) {
      return sectionalData.reasoning;
    }

    return analysisData?.reasoning;
  }, [analysisData?.reasoning, hasInterleavedFlow, sectionalData.reasoning]);

  const hasConversationTextStarted = React.useMemo(
    () => parts.some((part) => part.type === "text" && part.text.trim().length > 0),
    [parts]
  );

  const shouldOpenReasoning =
    isCurrentlyStreaming &&
    !!(availableReasoning && availableReasoning.length > 0) &&
    !hasConversationTextStarted;

  const lastTextPartIndex = React.useMemo(() => {
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      if (parts[i].type === "text") {
        return i;
      }
    }

    return -1;
  }, [parts]);

  const renderItems = React.useMemo<RenderItem[]>(() => {
    const items: RenderItem[] = [];

    if (hasInterleavedFlow) {
      parts.forEach((part, index) => {
        const key = `${message.id}-part-${index}-${part.type}`;

        if (part.type === "text" || part.type === "interactive-step" || part.type === "choice-summary") {
          items.push({ kind: "preview-part", key, part, partIndex: index });
          return;
        }

        if (part.type === "data-reasoning" && part.data.length > 0) {
          items.push({ kind: "reasoning", key, reasoning: part.data });
          return;
        }

        if (part.type === "data-summary") {
          const summary = typeof part.data === "string" ? part.data : part.data.text;
          const citations: Citation[] = typeof part.data === "string" ? [] : part.data.citations ?? [];

          if (summary.trim().length > 0) {
            items.push({ kind: "summary", key, summary, citations });
          }
          return;
        }

        if (part.type === "data-claims" && part.data.length > 0) {
          items.push({ kind: "claims", key, claims: part.data });
          return;
        }

        if (part.type === "data-risks" && part.data.length > 0) {
          items.push({ kind: "risks", key, risks: part.data });
          return;
        }

        if (part.type === "data-explanation" && part.data.length > 0) {
          items.push({ kind: "explanations", key, explanations: part.data });
          return;
        }

        if (part.type === "data-references" && part.data.length > 0) {
          items.push({ kind: "references", key, references: part.data });
          return;
        }

        if (part.type === "data-actions" && part.data.actions.length > 0) {
          items.push({ kind: "actions", key, actions: part.data.actions });
          return;
        }

        if (part.type === "data-action-insight" && part.data.points.length > 0) {
          items.push({ kind: "action-insight", key, actionInsight: part.data });
          return;
        }

        if (part.type === "data-suggested-questions" && part.data.length > 0) {
          items.push({ kind: "suggested-questions", key, questions: part.data });
        }
      });

      return items;
    }

    if (availableReasoning && availableReasoning.length > 0) {
      items.push({ kind: "reasoning", key: `${message.id}-analysis-reasoning`, reasoning: availableReasoning });
    }

    const hasPreviewableParts = parts.some(
      (part) => part.type === "text" || part.type === "interactive-step" || part.type === "choice-summary"
    );

    if (hasPreviewableParts) {
      items.push({ kind: "preview-full", key: `${message.id}-preview-full` });
    }

    if (!analysisData) {
      return items;
    }

    if (analysisData.summary.trim().length > 0) {
      items.push({
        kind: "summary",
        key: `${message.id}-analysis-summary`,
        summary: analysisData.summary,
        citations: analysisData.summaryCitations ?? [],
      });
    }

    if (analysisData.claims.length > 0) {
      items.push({ kind: "claims", key: `${message.id}-analysis-claims`, claims: analysisData.claims });
    }

    if (analysisData.risks.length > 0) {
      items.push({ kind: "risks", key: `${message.id}-analysis-risks`, risks: analysisData.risks });
    }

    if (analysisData.explanations.length > 0) {
      items.push({
        kind: "explanations",
        key: `${message.id}-analysis-explanations`,
        explanations: analysisData.explanations,
      });
    }

    if (analysisData.references.length > 0) {
      items.push({ kind: "references", key: `${message.id}-analysis-references`, references: analysisData.references });
    }

    if (analysisData.suggestedQuestions.length > 0) {
      items.push({
        kind: "suggested-questions",
        key: `${message.id}-analysis-suggested-questions`,
        questions: analysisData.suggestedQuestions,
      });
    }

    return items;
  }, [analysisData, availableReasoning, hasInterleavedFlow, message.id, parts]);

  const getMessageContent = (): string => {
    return parts
      .filter((part) => part.type === "text")
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("\n\n");
  };

  const handleCopyMessage = async () => {
    const content = getMessageContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(message.id);

      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const renderItem = (item: RenderItem) => {
    if (item.kind === "preview-full") {
      return (
        <motion.div key={item.key} {...fadeUp}>
          <PreviewMessage
            chatId={chatId}
            message={message}
            isLoading={isCurrentlyStreaming}
            completedStepSelections={completedStepSelections}
            onInteractiveChoice={onInteractiveChoice}
          />
        </motion.div>
      );
    }

    if (item.kind === "preview-part") {
      const singlePartMessage: MetabotUIMessage = {
        ...message,
        parts: [item.part],
      };

      return (
        <motion.div key={item.key} {...fadeUp}>
          <PreviewMessage
            chatId={chatId}
            message={singlePartMessage}
            isLoading={isCurrentlyStreaming && item.partIndex === lastTextPartIndex}
            completedStepSelections={completedStepSelections}
            onInteractiveChoice={onInteractiveChoice}
          />
        </motion.div>
      );
    }

    if (item.kind === "reasoning") {
      return (
        <motion.div key={item.key} {...fadeUp}>
          <ReasoningComponent
            messageId={message.id}
            reasoning={item.reasoning}
            isStreaming={isCurrentlyStreaming}
            defaultOpen={shouldOpenReasoning}
          />
        </motion.div>
      );
    }

    if (item.kind === "summary") {
      return (
        <motion.div key={item.key} {...fadeUp} className="mt-2">
          <SummaryCard summary={item.summary} citations={item.citations} />
        </motion.div>
      );
    }

    if (item.kind === "claims") {
      return (
        <motion.section key={item.key} {...fadeUp} className="space-y-2">
          {item.claims.map((claim, index) => (
            <ClaimCard key={`${item.key}-claim-${index}`} text={claim.text} confidence={claim.confidence} />
          ))}
        </motion.section>
      );
    }

    if (item.kind === "risks") {
      return (
        <motion.section key={item.key} {...fadeUp} className="space-y-2">
          {item.risks.map((risk, index) => (
            <RiskCard key={`${item.key}-risk-${index}`} type={risk.type} description={risk.description} />
          ))}
        </motion.section>
      );
    }

    if (item.kind === "explanations") {
      return (
        <motion.div key={item.key} {...fadeUp}>
          <section className="space-y-2">
            {item.explanations.map((entry, index) => (
              <ExplanationCard
                key={`${item.key}-explanation-${index}`}
                title={entry.title}
                explanation={entry.explanation}
              />
            ))}
          </section>
        </motion.div>
      );
    }

    if (item.kind === "references") {
      return (
        <motion.div key={item.key} {...fadeUp}>
          <details className="group rounded-xl bg-background border border-input p-4 py-3 transition-colors hover:bg-muted/70">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Sumber</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <section className="mt-3 space-y-2">
              {item.references.map((reference, index) => (
                <ReferenceCard key={`${item.key}-reference-${index}`} reference={reference} />
              ))}
            </section>
          </details>
        </motion.div>
      );
    }

    if (item.kind === "suggested-questions") {
      return (
        <motion.div key={item.key} {...fadeUp}>
          <SuggestionQuestions
            messageId={message.id}
            questions={item.questions}
            onQuestionClick={onSuggestionClick}
          />
        </motion.div>
      );
    }

    if (item.kind === "actions") {
      return (
        <motion.div key={item.key} {...fadeUp}>
          <AnalysisActions
            messageId={message.id}
            actions={item.actions}
            onActionClick={onActionClick}
            isLoading={isActionLoading}
            pendingActionId={pendingActionId}
          />
        </motion.div>
      );
    }

    if (item.kind === "action-insight") {
      return (
        <motion.div key={item.key} {...fadeUp}>
          <ActionInsightCard title={item.actionInsight.title} points={item.actionInsight.points} />
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div
      className={`flex gap-2 items-end group ${shouldAnimate ? "animate-in slide-in-from-left-2 duration-300" : ""} ${
        isHighlighted ? "message-highlight-container" : ""
      }`}
    >
      <div className="w-full md:max-w-full relative">
        <div
          className={`min-w-20 rounded-xl rounded-bl-sm pl-0 py-0 text-sm leading-relaxed text-foreground ${
            isHighlighted ? "message-highlight" : ""
          }`}
        >
          <div className="space-y-3">{renderItems.map((item) => renderItem(item))}</div>
        </div>

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
