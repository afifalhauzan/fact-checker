"use client";

import { ChatFooter } from "@/components/chat/chat-footer";
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
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setIsSidebarOpen(false);
    }
  }, []);

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
    if (input.trim() && conversationId && !isInitializing) {
      sendMessage({ text: input });
      setInput("");

      // Trigger scroll to bottom after 1s (same behavior as FAB)
      requestAnimationFrame(() => {
        setTimeout(() => {
            scrollToBottom();
        }, 120);
      });
    } else {
      toast.error('Pesan kosong atau ID percakapan tidak valid. Silahkan refresh halaman jika mengalami masalah ini.');
      console.log('[CHAT] Message blocked:', { hasInput: !!input.trim(), hasConversationId: !!conversationId, isInitializing });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (conversationId && !isInitializing) {
      sendMessage({ text: suggestion });
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
      />
    );
  };

  return (
    <div className="flex h-full w-full">
      {isSidebarOpen && (
        <aside className="h-full w-[280px] shrink-0 border-r border-border bg-muted/40 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Context</h2>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sources and saved insights will appear here.
          </p>
        </aside>
      )}

      <aside className="z-10 flex w-full lg:w-full shrink-0 flex-col border-l border-border bg-background h-full relative flex-1 min-w-0">

        <Toaster />

        <div className="border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title={isSidebarOpen ? "Hide context panel" : "Show context panel"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
            <span>Context</span>
          </button>
        </div>

        {/* Chat Box */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5"
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
          onSuggestionClick={handleSuggestionClick}
          isLoading={isLoading || isInitializing}
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
  );
}
