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
import { type MetabotUIMessage, type MetabotUIMessagePart } from "@/types/streaming";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import React from "react";
import { useStreaming } from "@/contexts/StreamingContext";
import { Sidebar } from "@/components/sidebar/sidebar";
import { type SidebarSourceItem } from "@/components/sidebar/SourceItem";
import { AnalysisSchema } from "@/langchain/agents/analyzer/schema";
import type { FileUIPart } from "ai";

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
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

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

  const sidebarSources = React.useMemo<SidebarSourceItem[]>(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const parts = (messages[i].parts || []) as MetabotUIMessagePart[];
      const sourcesPart = parts.find((part) => part.type === 'data-sources');

      if (sourcesPart && sourcesPart.type === 'data-sources' && Array.isArray(sourcesPart.data) && sourcesPart.data.length > 0) {
        return sourcesPart.data.map((source) => ({
          id: source.id,
          title: source.title,
          link: source.link,
        }));
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
        if (validation.success && validation.data.sources?.length > 0) {
          return validation.data.sources.map((source) => ({
            id: source.id,
            title: source.title,
            link: source.link,
          }));
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

  const handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleConfirmReset = async () => {
    await handleCreateNewSession();
    handleRefresh();
    setShowResetModal(false);
  };

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
      />
    );
  };

  return (
    <div className="relative flex bg-background h-full w-full flex-col overflow-x-hidden md:flex-row">
      {isSidebarOpen && (
        <Sidebar
          sources={sidebarSources}
          onClose={() => setIsSidebarOpen(false)}
          className={isMobile ? "absolute inset-0 z-30 h-full w-full border-b-0" : ""}
        />
      )}

      <div className={`flex min-h-0 w-full min-w-0 flex-1 items-stretch justify-center ${isMobile && isSidebarOpen ? "hidden" : ""}`}>
        <aside className="relative z-10 flex min-w-0 flex-1 shrink-0 flex-col bg-background md:max-w-3xl lg:w-full">

          <Toaster />

          <div className="px-4 py-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="inline-flex h-9 w-full items-center justify-between rounded-md bg-card px-3 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-8 sm:w-auto sm:justify-center sm:gap-2 sm:px-2"
              title={isSidebarOpen ? "Sembunyikan bagian konteks" : "Buka bagian konteks"}
              aria-expanded={isSidebarOpen}
              aria-label={isSidebarOpen ? "Sembunyikan panel konteks" : "Tampilkan panel konteks"}
            >
              <span className="font-medium">Konteks</span>
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
