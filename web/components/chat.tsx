"use client";

import { ChatFooter, type ComposerAttachment } from "@/components/chat/chat-footer";
import { ChatStart } from "@/components/chat/chat-start";
import { ConfirmModal } from "@/components/ui/modal";
import { UserMessage } from "@/components/chat/UserMessage";
import { AssistantMessage } from "@/components/chat/AssistantMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useChatInitialization } from "@/hooks/useChatInitialization";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useScrollToMessage } from "@/hooks/useScrollToMessage";
import { useConversationStore } from "@/lib/conversation-store";
import {
  clearLandingChatDraft,
  readLandingChatDraft,
  type LandingChatDraft,
} from "@/lib/landing-chat-handoff";
import { type MetabotUIMessage, type MetabotUIMessagePart } from "@/types/streaming";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import React from "react";
import { useStreaming } from "@/contexts/StreamingContext";
import { Sidebar } from "@/components/sidebar/sidebar";
import { type SidebarSourceItem } from "@/components/sidebar/SourceItem";
import { AnalysisSchema } from "@/langchain/agents/analyzer/schema";
import type { FileUIPart } from "ai";
import type { AnalysisAction, UIActionId, UIActionPayload } from "@/types/ui-actions";

function mapReferencesToSidebarSources(
  references: Array<{ title?: string; url?: string; citations?: Array<{ id?: string }> }>
): SidebarSourceItem[] {
  return references
    .filter(
      (reference) =>
        typeof reference.title === "string" &&
        reference.title.trim().length > 0 &&
        typeof reference.url === "string" &&
        reference.url.trim().length > 0
    )
    .map((reference, index) => ({
      id: reference.citations?.[0]?.id ?? `reference-${index + 1}`,
      title: reference.title as string,
      link: reference.url as string,
    }));
}

function extractActionContextFromMessage(message?: MetabotUIMessage): { claim?: string; context?: string } {
  if (!message) {
    return {};
  }

  const parts = (message.parts || []) as MetabotUIMessagePart[];

  const claimPart = parts.find((part) => part.type === "data-claims");
  const summaryPart = parts.find((part) => part.type === "data-summary");
  const explanationPart = parts.find((part) => part.type === "data-explanation");

  const claim =
    claimPart && claimPart.type === "data-claims" && claimPart.data.length > 0
      ? claimPart.data[0].text
      : undefined;

  const summaryContext =
    summaryPart && summaryPart.type === "data-summary"
      ? typeof summaryPart.data === "string"
        ? summaryPart.data
        : summaryPart.data.text
      : undefined;

  const explanationContext =
    explanationPart?.type === "data-explanation"
      ? explanationPart.data.map((entry) => `${entry.title}: ${entry.explanation}`).join("\n\n")
      : undefined;

  const context = summaryContext ?? explanationContext;

  if (claim || context) {
    return { claim, context };
  }

  const analysisPart = parts.find((part) => part.type === "data-analysis");
  if (!analysisPart || analysisPart.type !== "data-analysis" || !analysisPart.data) {
    return {};
  }

  try {
    const parsed = typeof analysisPart.data === "string" ? JSON.parse(analysisPart.data) : analysisPart.data;
    const validation = AnalysisSchema.safeParse(parsed);
    if (!validation.success) {
      return {};
    }

    return {
      claim: validation.data.claims[0]?.text,
      context:
        validation.data.summary ||
        validation.data.explanations.map((entry) => `${entry.title}: ${entry.explanation}`).join("\n\n"),
    };
  } catch {
    return {};
  }
}

function extractLatestAttachmentMetadata(messages: MetabotUIMessage[]): UIActionPayload["attachment"] | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role !== "user") {
      continue;
    }

    const filePart = ((messages[i].parts || []) as MetabotUIMessagePart[]).find((part) => part.type === "file");
    if (filePart && filePart.type === "file") {
      return {
        name: filePart.filename,
        type: filePart.mediaType,
        size: (filePart as any).size ?? filePart.providerMetadata?.size,
        previewUrl: filePart.url,
      };
    }
  }

  return undefined;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function Chat() {
  // Get streaming state from context
  const {
    messages,
    sendMessage,
    status,
    stop,
    isLoading,
    isAuthReady,
    handleRefresh,
    renderMessageContent,
    chatId,
    handleInteractiveChoice
  } = useStreaming();

  // === Initialization Engine ===
  const {
    conversationId,
    isInitializing,
    error,
    handleCreateNewSession
  } = useChatInitialization();

  const { setHasMessages } = useConversationStore();

  // Create refs at top level to use in multiple hooks
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // === Focus Scroll Engine (Highlight Navigation) ===
  const {
    justScrolledToContextRef,
    shouldLockScroll: messageLocked
  } = useScrollToMessage({
    messagesContainerRef
  });

  // === Auto-Scroll Engine ===
  const {
    messagesEndRef,
    isAtBottom,
    scrollToBottom
  } = useAutoScroll({ messages, disabled: messageLocked, messagesContainerRef });

  // UI State
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<ComposerAttachment[]>([]);
  const [pendingLandingDraft, setPendingLandingDraft] = React.useState<LandingChatDraft | null>(null);
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);
  const [pendingActionId, setPendingActionId] = React.useState<UIActionId | null>(null);
  const hasHydratedLandingDraftRef = React.useRef(false);
  const hasAutoSentLandingDraftRef = React.useRef(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const initialIsMobile = mediaQuery.matches;
    setIsMobile(initialIsMobile);

    if (initialIsMobile) {
      setIsSidebarOpen(false);
    }

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleViewportChange);
      return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  React.useEffect(() => {
    if (hasHydratedLandingDraftRef.current) return;

    const draft = readLandingChatDraft();
    hasHydratedLandingDraftRef.current = true;

    if (!draft) return;

    setPendingLandingDraft(draft);
    setInput(draft.text);
    setAttachments(
      draft.attachments.map((attachment) => ({
        type: "file",
        id: attachment.id,
        filename: attachment.filename,
        mediaType: attachment.mediaType,
        url: attachment.url,
        size: attachment.size,
      }))
    );
  }, []);

  React.useEffect(() => {
    if (!pendingLandingDraft || hasAutoSentLandingDraftRef.current) return;
    if (!conversationId || isInitializing || !isAuthReady || isLoading) return;

    const hasText = pendingLandingDraft.text.trim().length > 0;
    const fileParts: FileUIPart[] = pendingLandingDraft.attachments.map(({ id, size, ...filePart }) => ({
      type: "file",
      ...filePart,
    }));

    if (!hasText && fileParts.length === 0) {
      clearLandingChatDraft();
      setPendingLandingDraft(null);
      return;
    }

    hasAutoSentLandingDraftRef.current = true;

    if (hasText) {
      sendMessage({
        text: pendingLandingDraft.text.trim(),
        files: fileParts.length > 0 ? fileParts : undefined,
      });
    } else {
      sendMessage({ files: fileParts });
    }

    clearLandingChatDraft();
    setPendingLandingDraft(null);
    setInput("");
    setAttachments([]);

    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollToBottom();
      }, 120);
    });
  }, [
    conversationId,
    isAuthReady,
    isInitializing,
    isLoading,
    pendingLandingDraft,
    scrollToBottom,
    sendMessage,
  ]);

  const sidebarSources = React.useMemo<SidebarSourceItem[]>(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const parts = (messages[i].parts || []) as MetabotUIMessagePart[];
      const referencesPart = parts.find((part) => part.type === 'data-references');

      if (
        referencesPart &&
        referencesPart.type === "data-references" &&
        Array.isArray(referencesPart.data) &&
        referencesPart.data.length > 0
      ) {
        const mappedFromReferences = mapReferencesToSidebarSources(referencesPart.data);
        if (mappedFromReferences.length > 0) {
          return mappedFromReferences;
        }
      }

      const analysisPart = parts.find((part) => part.type === 'data-analysis');

      if (!analysisPart || analysisPart.type !== 'data-analysis' || !analysisPart.data) {
        continue;
      }

      try {
        const parsed = typeof analysisPart.data === 'string'
          ? JSON.parse(analysisPart.data)
          : analysisPart.data;

        const validation = AnalysisSchema.safeParse(parsed);
        if (validation.success && validation.data.references?.length > 0) {
          const mappedFromReferences = mapReferencesToSidebarSources(validation.data.references);
          if (mappedFromReferences.length > 0) {
            return mappedFromReferences;
          }
        }

        // Backward compatibility for historical stored analysis data that still used `sources`.
        if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).sources)) {
          const legacySources = (parsed as any).sources
            .filter((item: any) => typeof item?.title === "string" && typeof item?.link === "string")
            .map((source: any, sourceIndex: number) => ({
              id: typeof source.id === "string" ? source.id : `legacy-source-${sourceIndex + 1}`,
              title: source.title,
              link: source.link,
            }));

          if (legacySources.length > 0) {
            return legacySources;
          }
        }
      } catch {
        continue;
      }
    }

    return [];
  }, [messages]);

  const completedStepSelections = React.useMemo(() => {
    const completed = new Map<string, string>();

    for (const message of messages) {
      for (const part of (message.parts || []) as MetabotUIMessagePart[]) {
        if (part.type === 'choice-summary' && part.data?.stepId && part.data?.selection) {
          completed.set(part.data.stepId, part.data.selection);
        }
      }
    }

    return completed;
  }, [messages]);

  // Update hasMessages state when messages change
  React.useEffect(() => {
    setHasMessages(messages.length > 0);
  }, [messages.length, setHasMessages]);

  React.useEffect(() => {
    if (!isLoading) {
      setPendingActionId(null);
    }
  }, [isLoading]);

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    const hasText = input.trim().length > 0;
    const hasFiles = attachments.length > 0;

    if ((hasText || hasFiles) && conversationId && !isInitializing) {
      const fileParts: FileUIPart[] = attachments.map(({ id, size, ...filePart }) => filePart);

      if (hasText) {
        sendMessage({ text: input, files: fileParts.length > 0 ? fileParts : undefined });
      } else {
        sendMessage({ files: fileParts });
      }

      setInput("");
      setAttachments([]);

      // Trigger scroll to bottom after 1s (same behavior as FAB)
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom();
        }, 120);
      });
    } else {
      toast.error('Pesan kosong/lampiran belum ada atau ID percakapan tidak valid. Silahkan refresh halaman jika mengalami masalah ini.');
      console.log('[CHAT] Message blocked:', { hasInput: hasText, hasFiles, hasConversationId: !!conversationId, isInitializing });
    }
  };

  const handleSelectFiles = React.useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    try {
      const selectedFiles = Array.from(files);
      const nextAttachments = await Promise.all(
        selectedFiles.map(async (file): Promise<ComposerAttachment> => ({
          type: "file",
          id: createAttachmentId(),
          filename: file.name,
          mediaType: file.type || "application/octet-stream",
          url: await fileToDataUrl(file),
          size: file.size,
        }))
      );

      setAttachments((prev) => [...prev, ...nextAttachments]);
    } catch (error) {
      console.error("[Chat] Failed to prepare attachments:", error);
      toast.error("Gagal membaca lampiran. Coba lagi ya.");
    }
  }, []);

  const handleRemoveAttachment = React.useCallback((id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    if (conversationId && !isInitializing) {
      sendMessage({ text: suggestion });

      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom();
        }, 120);
      });
    }
  };

  const handleActionClick = (action: AnalysisAction, sourceMessageId?: string) => {
    if (!conversationId || isInitializing || isLoading) {
      return;
    }

    const sourceMessage = sourceMessageId ? messages.find((message) => message.id === sourceMessageId) : undefined;
    const { claim, context } = extractActionContextFromMessage(sourceMessage);
    const attachment = extractLatestAttachmentMetadata(messages);

    const payload: UIActionPayload = {
      type: "UI_ACTION",
      actionId: action.id,
      actionLabel: action.label,
      sourceMessageId,
      claim,
      context,
      attachment,
    };

    setPendingActionId(action.id);
    sendMessage(
      { text: action.label },
      {
        action_type: "UI_ACTION",
        action_payload: payload,
      }
    );

    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollToBottom();
      }, 120);
    });
  };

  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleConfirmReset = async () => {
    await handleCreateNewSession();
    handleRefresh();
    setShowResetModal(false);
  };

  const sidebarMode = isSidebarOpen ? "expanded" : "collapsed";
  const shouldRenderSidebar = !isMobile || isSidebarOpen;

  const renderMessage = (message: MetabotUIMessage, index: number) => {
    const isUser = message.role === "user";
    const isLastMessage = index === messages.length - 1;

    if (isUser) {
      return (
        <UserMessage
          key={message.id}
          message={message}
          renderMessageContent={renderMessageContent}
        />
      );
    }

    return (
      <AssistantMessage
        key={message.id}
        message={message}
        chatId={chatId}
        isStreaming={status === "streaming"}
        isLastMessage={isLastMessage}
        completedStepSelections={completedStepSelections}
        onInteractiveChoice={handleInteractiveChoice}
        onSuggestionClick={handleSuggestionClick}
        onActionClick={handleActionClick}
        pendingActionId={pendingActionId}
        isActionLoading={isLoading}
      />
    );
  };

  return (
    <div className="relative flex bg-background h-full w-full flex-col overflow-x-hidden md:flex-row">
      {shouldRenderSidebar && (
        <Sidebar
          sources={sidebarSources}
          mode={sidebarMode}
          onExpand={() => setIsSidebarOpen(true)}
          onCollapse={() => setIsSidebarOpen(false)}
          className={isMobile ? "absolute inset-0 z-30 h-full w-full border-b-0" : ""}
        />
      )}

      <div className={`flex min-h-0 w-full min-w-0 flex-1 items-stretch justify-center ${isMobile && isSidebarOpen ? "hidden" : ""}`}>
        <aside className="relative z-10 flex min-w-0 flex-1 shrink-0 flex-col bg-background md:max-w-3xl lg:w-full">

          <Toaster />

          <div className="flex justify-end px-4 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card/90 px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title={isSidebarOpen ? "Sembunyikan bagian konteks" : "Buka bagian konteks"}
              aria-expanded={isSidebarOpen}
              aria-label={isSidebarOpen ? "Sembunyikan panel konteks" : "Tampilkan panel konteks"}
            >
              <span>Konteks</span>
              {isSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4 shrink-0" />
              ) : (
                <PanelLeftOpen className="h-4 w-4 shrink-0" />
              )}
            </button>
          </div>

          {/* Chat Box */}
          <div
            ref={messagesContainerRef}
            className="no-scrollbar flex-1 bg-background overflow-y-auto p-4 flex flex-col gap-3.5 "
          >
            {!isAuthReady ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Memuat autentikasi...</p>
                </div>
              </div>
            ) : isInitializing ? (
              <div className="flex gap-2 items-end animate-in fade-in duration-500">
                <div className="max-w-full md:max-w-[80%] rounded-xl rounded-bl-sm border border-border bg-secondary p-3 text-sm leading-relaxed text-secondary-foreground">
                  <div className="flex gap-1 items-center">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-duration:1.4s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.2s] [animation-duration:1.4s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.4s] [animation-duration:1.4s]"></span>
                    </div>
                    <span className="ml-2 animate-pulse">Memulai percakapan...</span>
                  </div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <ChatStart
                onSuggestionClick={handleSuggestionClick}
                isLoading={isLoading || isInitializing || !isAuthReady}
              />
            ) : (
              <>
                {messages.map((message: MetabotUIMessage, index: number) => {
                  const isLastUserMessage = message.role === 'user' && index === messages.length - 1;

                  return (
                    <div key={message.id} data-message-id={message.id}>
                      {renderMessage(message, index)}

                      {/* Show typing indicator below user message when loading */}
                      {isLoading && isLastUserMessage && (
                        <TypingIndicator />
                      )}
                    </div>
                  );
                })}
              </>
            )}

            <div
              ref={messagesEndRef}
              className="shrink-0 min-w-[24px] min-h-[10px]"
            />
          </div>

          <ChatFooter
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading || isInitializing}
            attachments={attachments}
            onSelectFiles={handleSelectFiles}
            onRemoveAttachment={handleRemoveAttachment}
          />

          {/* Scroll to Bottom FAB */}
          {!isAtBottom && (
            <div className="absolute bottom-30 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <button
                onClick={scrollToBottom}
                className="flex items-center justify-center h-8 px-[6px] bg-white border border-border text-gray-800 rounded-full shadow-lg hover:bg-primary/90 hover:text-primary-foreground transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-in fade-in zoom-in-75 duration-200"
                title="Scroll to latest message"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* <ConfirmModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={handleConfirmReset}
          title="Reset Percakapan"
          description="Apakah anda yakin untuk menghapus sesi percakapan ini? Ini akan menghapus semua pesan dan riwayat percakapan."
          confirmText="Reset"
          cancelText="Cancel"
          isDestructive={true}
        /> */}
        </aside>
      </div>
    </div>
  );
}
