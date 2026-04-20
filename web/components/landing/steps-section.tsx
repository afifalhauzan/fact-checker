const steps = [
  {
    number: "1",
    title: "Paste & Input",
    description:
      "Bring any confusing headline, tweet, or WhatsApp forward. No matter how complex, we handle it.",
  },
  {
    number: "2",
    title: "AI Deconstructs",
    description:
      "Our models parse the logic, cross-reference data points, and identify emotional triggers or fallacies.",
  },
  {
    number: "3",
    title: "Explore & Verify",
    description:
      "Interact with the results. Ask follow-up questions, check cited research, and gain total intellectual clarity.",
  },
];

export function StepsSection() {
  return (
    <section className="mx-auto mb-24 w-full max-w-[1440px] px-4 sm:mb-32 sm:px-8">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-20 lg:gap-24">
        {steps.map((step) => (
          <article key={step.number} className="relative">
            <span className="pointer-events-none absolute -left-2 -top-16 select-none font-['Newsreader',serif] text-[112px] italic leading-none text-[#4e45e4]/10 sm:text-[120px]">
              {step.number}
            </span>
            <div className="relative pt-8">
              <h3 className="mb-3 font-['Newsreader',serif] text-[2rem] leading-tight text-[#2c3437] sm:mb-4">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-[#596064]">{step.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
