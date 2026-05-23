/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { File as FileIcon } from "lucide-react";
import { type MetabotUIMessage } from "@/types/streaming";
import { useInteractionStore } from "@/lib/interaction-store";
import { formatMediaTypeLabel } from "@/utils/formatters";
import { Modal } from "@/components/ui/modal";

interface UserMessageProps {
  message: MetabotUIMessage;
  renderMessageContent: (message: MetabotUIMessage) => string;
}

interface FilePart {
  type: "file";
  mediaType: string;
  filename?: string;
  url: string;
}

export function UserMessage({ message, renderMessageContent }: UserMessageProps) {
  const { targetMessageId } = useInteractionStore();
  const isHighlighted = targetMessageId === message.id;
  const [previewImage, setPreviewImage] = React.useState<{ url: string; filename?: string } | null>(null);

  // Only apply entrance animation on first mount, not on highlight changes
  const mountedRef = React.useRef(true);
  const shouldAnimate = mountedRef.current;

  React.useEffect(() => {
    mountedRef.current = false;
  }, []);

  const text = renderMessageContent(message);
  const fileParts = React.useMemo(() => {
    if (!message.parts || !Array.isArray(message.parts)) {
      return [] as FilePart[];
    }

    return message.parts.filter(
      (part): part is FilePart =>
        part.type === "file" &&
        typeof part.url === "string" &&
        typeof part.mediaType === "string"
    );
  }, [message.parts]);

  return (
    <>
      <div className={`flex gap-2 items-end justify-end ${
        shouldAnimate ? 'animate-in slide-in-from-right-2 duration-300' : ''
      }`}>
        <div className="flex w-full md:max-w-[82%] flex-col items-end gap-2">
          {fileParts.length > 0 && (
            <div className={`w-full rounded-2xl rounded-br-md bg-card p-2 pr-0 ${isHighlighted ? 'message-highlight' : ''}`}>
              <div className="grid grid-cols-1 gap-2">
                {fileParts.map((file, index) => {
                  const isImage = file.mediaType.startsWith("image/");

                  if (isImage) {
                    return (
                      <button
                        key={`${message.id}-file-${index}`}
                        type="button"
                        onClick={() => setPreviewImage({ url: file.url, filename: file.filename })}
                        className="group overflow-hidden rounded-xl bg-muted text-left"
                      >
                        <img
                          src={file.url}
                          alt={file.filename || "attached image"}
                          className="max-h-80 w-full border-none object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                        {file.filename && (
                          <p className="truncate px-2 py-1.5 text-xs text-foreground/90">
                            {file.filename}
                          </p>
                        )}
                      </button>
                    );
                  }

                  return (
                    <a
                      key={`${message.id}-file-${index}`}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-border bg-muted px-2.5 py-2 hover:bg-accent"
                    >
                      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="overflow-hidden">
                        <p className="truncate text-xs font-medium text-foreground">
                          {file.filename || "attachment"}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">{formatMediaTypeLabel(file.mediaType)}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {text.trim().length > 0 && (
            <div className={`max-w-full rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground ${
              isHighlighted ? 'message-highlight' : ''
            }`}>
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.filename || "Image preview"}
        showCloseButton={true}
      >
        {previewImage ? (
          <div className="flex items-center justify-center">
            <img
              src={previewImage.url}
              alt="Preview image"
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
