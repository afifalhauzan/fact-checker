import Link from "next/link";

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-[1000px] px-4 sm:px-8">
      <div className="relative overflow-hidden rounded-[32px] bg-[#eef2f5] px-6 py-16 text-center sm:rounded-[40px] sm:px-8 sm:py-24">
        <div className="relative z-10">
          <h3 className="mb-6 font-['Newsreader',serif] text-[2.25rem] leading-tight text-[#2c3437] sm:text-5xl">
            Ready to see through the noise?
          </h3>
          <Link
            href="/login"
            className="inline-flex rounded-full bg-[#2c3437] px-8 py-3 text-sm font-medium text-[#f7f9fb] transition-opacity hover:opacity-90 sm:px-10 sm:py-4"
          >
            Start Your First Analysis
          </Link>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#4e45e4]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-[#f5cdf9]/35 blur-3xl" />
      </div>
    </section>
  );
}
