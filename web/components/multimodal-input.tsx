"use client";

import type { CreateUIMessage, UIMessage, UseChatHelpers, UseChatOptions } from "@ai-sdk/react";

type ChatRequestOptions = {
  headers?: Record<string, string> | Headers;
  body?: object;
  data?: any;
};
import { motion } from "framer-motion";
import type React from "react";
import {
  useRef,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import toast from "react-hot-toast";
import { useLocalStorage, useWindowSize } from "usehooks-ts";

import { cn, sanitizeUIMessages } from "@/utils/utils";

import { Square } from "lucide-react";

const suggestedActions = [
  {
    title: "Tren Transaksi",
    action: "Tren Transaksi",
  },
  {
    title: "Volume MDR", 
    action: "Volume MDR",
  },
];

export function MultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  messages,
  setMessages,
  sendMessage,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  messages: Array<UIMessage>;
  setMessages: Dispatch<SetStateAction<Array<UIMessage>>>;
  sendMessage: UseChatHelpers<UIMessage>['sendMessage']
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLInputElement>(null);
  const { width } = useWindowSize();

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const submitForm = useCallback(() => {
    handleSubmit(undefined, {});
    setLocalStorageInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [handleSubmit, setLocalStorageInput, width]);

  return (
    <div className="shrink-0">
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {suggestedActions.map((suggestedAction, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.05 * index }}
              key={`suggested-action-${suggestedAction.title}-${index}`}
            >
              <button
                onClick={async () => {
                  sendMessage({
                    role: "user",
                    parts: [
                      {
                        type: "text",
                        text: suggestedAction.action,
                      },
                    ],
                  });
                }}
                className="rounded-full border border-border bg-accent px-3 py-1 text-[11.5px] font-medium text-accent-foreground transition-all hover:bg-accent/80 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {suggestedAction.title}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isLoading) {
              toast.error("Please wait for the model to finish its response!");
            } else {
              submitForm();
            }
          }}
          className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-border bg-background p-1.5 pl-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
        >
          <input
            ref={textareaRef as any}
            type="text"
            value={input || ""}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya sesuatu..."
            autoComplete="off"
            disabled={isLoading}
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (isLoading) {
                  toast.error("Please wait for the model to finish its response!");
                } else {
                  submitForm();
                }
              }
            }}
          />
          
          {isLoading ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                stop();
                setMessages((messages) => sanitizeUIMessages(messages));
              }}
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground shadow-md transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input || input.length === 0}
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          )}
        </form>
        <p className="mt-2 text-center text-[10px] tracking-wide text-muted-foreground">
          METABOT AI bisa salah. Selalu verifikasi hasil analitik.
        </p>
      </div>
    </div>
  );
}
