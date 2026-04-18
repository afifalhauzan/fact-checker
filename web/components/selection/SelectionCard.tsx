import React from 'react';

interface SelectionCardProps {
  id: string;
  title: string;
  description: string;
  isSelected: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}

export function SelectionCard({
  title,
  description,
  isSelected,
  icon,
  onClick,
}: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col rounded-lg p-5 text-left cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-card hover:bg-accent/50'
      }`}
    >
      <div
        className={`absolute top-4 right-4 h-5 w-5 rounded-full border-2 transition-all ${
          isSelected
            ? 'border-primary bg-primary'
            : 'border-border bg-background hover:border-primary/50'
        }`}
      >
        {isSelected && (
          <div className="inset-0 flex items-center justify-center text-white text-xs">✓</div>
        )}
      </div>

      <div className={`mb-3 ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
        {icon}
      </div>

      <span className={`pr-8 text-sm font-bold uppercase tracking-wide ${isSelected ? 'text-white' : 'text-foreground'}`}>
        {title}
      </span>
      <span className={`mt-2 text-xs ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
        {description}
      </span>
    </button>
  );
}
