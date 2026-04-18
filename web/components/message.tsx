"use client";

import type { MetabotUIMessage } from "@/types/streaming";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";
import { AnimatedMarkdown } from "flowtoken";
import "flowtoken/dist/styles.css";

import { Sparkles } from "lucide-react";
import { cn } from "@/utils/utils";
import { InteractiveStep } from "@/components/chat/InteractiveStep";
import { ChoiceSummary } from "@/components/chat/ChoiceSummary";
import type { MetabotUIMessagePart } from "@/types/streaming";

export const PreviewMessage = ({
  message,
  isLoading,
  completedStepSelections = new Map<string, string>(),
  onInteractiveChoice,
}: {
  chatId: string;
  message: MetabotUIMessage;
  isLoading: boolean;
  completedStepSelections?: Map<string, string>;
  onInteractiveChoice?: (stepId: string, option: string) => void | Promise<void>;
}) => {
  // Handle both streaming format (message.parts) and history format (message.content)
  const getMessageContent = () => {
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts;
    }

    return [];
  };

  const contentParts = getMessageContent() as MetabotUIMessagePart[];

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-1 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          "group-data-[role=user]/message:bg-primary group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 group-data-[role=user]/message:py-2 rounded-xl",
          "w-full md:w-full group-data-[role=user]/message:w-auto group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-xs sm:group-data-[role=user]/message:max-w-sm md:group-data-[role=user]/message:max-w-2xl"
        )}
      >
        {/* {message.role === "assistant" && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
            <Sparkles size={14} />
          </div>
        )} */}

        <div className="flex flex-col gap-2 w-full text-sm md:text-base">
          {contentParts.length > 0 &&
            contentParts.map((part, index: number) => {
              if (part.type === "text") {
                return (
                  <div key={message.id || index} className="flex flex-col gap-0 prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent">
                    <div className="min-h-[1.5rem] leading-relaxed">
                      <AnimatePresence mode="wait">
                        {message.role === "assistant" && isLoading ? (
                          <motion.div
                            key="animated"
                            initial={{ opacity: 0, filter: "blur(1.5px)" }} // DEVNOTE: Please dont change this to just opacity, the slight blur helps mask the leading space issue in streamdown rendering
                            animate={{ opacity: 1, filter: "blur(0px)" }} 
                            exit={{ opacity: 0, filter: "blur(1.5px)" }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="animated-markdown-container"
                          >
                            <AnimatedMarkdown
                              content={part.text}
                              animation="dropIn"
                              animationDuration="0.5s"
                              animationTimingFunction="ease-in-out"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="static"
                            initial={{ opacity: 0, filter: "blur(1.5px)" }} // yeah same here
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                          >
                            <Streamdown>{part.text}</Streamdown>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              }

              if (part.type === 'interactive-step') {
                const completedSelection = completedStepSelections.get(part.data.stepId);

                return (
                  <InteractiveStep
                    key={`${message.id}-interactive-${part.data.stepId}`}
                    stepId={part.data.stepId}
                    question={part.data.question}
                    options={part.data.options}
                    isCompleted={!!completedSelection}
                    completedSelection={completedSelection}
                    onSelectOption={onInteractiveChoice ?? (() => undefined)}
                  />
                );
              }

              if (part.type === 'choice-summary') {
                return (
                  <ChoiceSummary
                    key={`${message.id}-choice-${part.data.stepId}`}
                    selection={part.data.selection}
                  />
                );
              }

              return null;
            })}
        </div>
      </div>
    </motion.div>
  );
};

