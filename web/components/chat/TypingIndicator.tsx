import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end mt-3 animate-in fade-in duration-300">
      <div className="max-w-[82%] px-2 py-3 transition-opacity duration-300">
        <div className="flex gap-1 items-center">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-duration:1.4s]"></span>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.2s] [animation-duration:1.4s]"></span>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.4s] [animation-duration:1.4s]"></span>
          <span className="ml-2 text-xs text-muted-foreground animate-pulse">AI sedang berpikir...</span>
        </div>
      </div>
    </div>
  );
}