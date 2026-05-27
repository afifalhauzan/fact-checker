interface SuggestionQuestionsProps {
  messageId: string;
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export function SuggestionQuestions({ messageId, questions, onQuestionClick }: SuggestionQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Pertanyaan Lanjutan
      </p>
      {questions.map((question, index) => (
        <button
          key={`${messageId}-suggested-question-${index}`}
          type="button"
          onClick={() => onQuestionClick(question)}
          className="rounded-xl bg-muted/40 px-3 py-2 text-left text-sm leading-relaxed text-foreground hover:bg-accent transition-colors"
        >
          {question}
        </button>
      ))}
    </section>
  );
}
