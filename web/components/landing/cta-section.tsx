import Link from "next/link";

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-[1000px] px-4 sm:px-8">
      <div className="relative overflow-hidden rounded-lg border border-[#17232c]/10 bg-[#eaf3f8] px-6 py-14 text-center sm:px-8 sm:py-20">
        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[#5a6a76]">FactChecker AI</p>
          <h3 className="mb-5 font-[var(--font-instrument-serif)] text-[2.35rem] leading-[0.98] text-[#17232c] sm:text-5xl">
            Lebih jernih saat informasi terasa meyakinkan terlalu cepat.
          </h3>
          <p className="mx-auto mb-7 max-w-xl text-base leading-relaxed text-[#5a6a76]">
            Mulai dari satu klaim kecil. Biarkan AI mengurai alasan, konteks, dan ruang ragunya.
          </p>
          <Link
            href="/login"
            className="inline-flex rounded-md bg-[#17232c] px-8 py-3 text-sm font-medium text-[#f8fbff] transition-opacity hover:opacity-90 sm:px-10 sm:py-4"
          >
            Mulai analisis
          </Link>
        </div>
      </div>
    </section>
  );
}
