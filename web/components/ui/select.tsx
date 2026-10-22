"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/utils/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown while `value` matches no option. Also becomes the first, empty-valued choice when `clearable`. */
  placeholder: string;
  ariaLabel: string;
  /** Adds the placeholder as a choice with the empty value, like a native `<option value="">`. */
  clearable?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/** A styled dropdown with keyboard support, in place of the browser's native select popup. */
export function Select({ value, onChange, options, placeholder, ariaLabel, clearable = false, size = "md", className }: SelectProps) {
  const listboxId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const items = React.useMemo<SelectOption[]>(
    () => (clearable ? [{ value: "", label: placeholder }, ...options] : options),
    [clearable, options, placeholder]
  );
  const selected = options.find((option) => option.value === value);
  const isSmall = size === "sm";

  const open = () => {
    setActiveIndex(Math.max(0, items.findIndex((item) => item.value === value)));
    setIsOpen(true);
  };

  const choose = (item: SelectOption) => {
    onChange(item.value);
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePress = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsidePress);
    return () => document.removeEventListener("mousedown", closeOnOutsidePress);
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) document.getElementById(`${listboxId}-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex, listboxId]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) return;
    event.preventDefault();

    if (!isOpen) {
      open();
      return;
    }

    if (event.key === "ArrowDown") setActiveIndex((index) => Math.min(items.length - 1, index + 1));
    else if (event.key === "ArrowUp") setActiveIndex((index) => Math.max(0, index - 1));
    else if (event.key === "Home") setActiveIndex(0);
    else if (event.key === "End") setActiveIndex(items.length - 1);
    else choose(items[activeIndex]);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? `${listboxId}-${activeIndex}` : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSmall ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm",
          isOpen && "border-primary ring-2 ring-primary/20"
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-max overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100"
        >
          {items.map((item, index) => {
            const isSelected = item.value === value;
            return (
              <li
                key={item.value || "__empty"}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={isSelected}
                // Keep focus on the trigger so the keyboard keeps working after a click
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5",
                  isSmall ? "text-xs" : "text-sm",
                  index === activeIndex && "bg-accent",
                  isSelected ? "font-medium text-primary" : "text-foreground",
                  !item.value && "text-muted-foreground"
                )}
              >
                <span>{item.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
