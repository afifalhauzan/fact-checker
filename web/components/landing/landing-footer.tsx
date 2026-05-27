export function LandingFooter() {
  const links = ["Privasi", "Ketentuan", "Keamanan", "Kontak"];

  return (
    <footer className="mt-24 w-full border-t border-[#17232c]/10 bg-[#eef5f9] py-10 sm:py-12">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-8 px-4 sm:px-12 md:flex-row md:items-center">
        <div>
          <div className="mb-2 font-[var(--font-instrument-serif)] text-2xl text-[#17232c]">RiskCheck Loker</div>
          <p className="text-sm tracking-wide text-[#17232c]/60">
            2026 RiskCheck Loker. Membantu pencari kerja muda menganalisis risiko lowongan sebelum mengambil keputusan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm tracking-wide text-[#17232c]/60 transition-all duration-200 hover:text-[#2b6f95] hover:underline hover:underline-offset-4"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
