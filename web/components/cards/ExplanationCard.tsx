import { ChevronDown } from "lucide-react";
import { FaCircleQuestion } from "react-icons/fa6";

interface ExplanationCardProps {
    title?: string;
    explanation?: string;
}

export function ExplanationCard({ title, explanation }: ExplanationCardProps) {
    if (!title?.trim().length || !explanation?.trim().length) {
        return null;
    }

    return (
        <details className="rounded-xl bg-muted/50 p-4 group transition-colors hover:bg-muted/70">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-muted-foreground">
                <div className="flex gap-3 justify-start items-center">
                    <FaCircleQuestion className="text-lg" />
                    <span>{title}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="mt-2 pt-2 text-xs italic leading-relaxed text-muted-foreground">
                {explanation}
            </div>
        </details>
    );
}
