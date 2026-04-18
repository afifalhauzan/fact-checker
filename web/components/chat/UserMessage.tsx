import React from 'react';
import { type MetabotUIMessage } from "@/types/streaming";
import { useInteractionStore } from "@/lib/interaction-store";

interface UserMessageProps {
  message: MetabotUIMessage;
  renderMessageContent: (message: MetabotUIMessage) => string;
}

export function UserMessage({ message, renderMessageContent }: UserMessageProps) {
  const { targetMessageId } = useInteractionStore();
  const isHighlighted = targetMessageId === message.id;
  
  // Only apply entrance animation on first mount, not on highlight changes
  const mountedRef = React.useRef(true);
  const shouldAnimate = mountedRef.current;
  
  React.useEffect(() => {
    mountedRef.current = false;
  }, []);

  return (
    <div className={`flex gap-2 items-end justify-end ${
      shouldAnimate ? 'animate-in slide-in-from-right-2 duration-300' : ''
    }`}>
      <div className={`max-w-full md:max-w-[82%] rounded-xl rounded-br-sm bg-primary p-3 text-sm leading-relaxed text-primary-foreground ${
        isHighlighted ? 'message-highlight' : ''
      }`}>
        {renderMessageContent(message)}
      </div>
    </div>
  );
}