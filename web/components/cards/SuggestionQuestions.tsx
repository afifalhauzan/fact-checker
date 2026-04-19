interface SuggestionQuestionsProps {
  messageId: string;
  questions: string[];
}

export function SuggestionQuestions({ messageId, questions }: SuggestionQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      {/* <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Suggested questions
      </p> */}
      {questions.map((question, index) => (
        <button
          key={`${messageId}-suggested-question-${index}`}
          type="button"
          className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-left text-sm leading-relaxed text-foreground hover:bg-accent transition-colors"
        >
          {question}
        </button>
      ))}
    </section>
  );
}