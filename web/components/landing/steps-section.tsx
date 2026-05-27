const steps = [
  {
    number: "1",
    title: "Tempel lowongan",
    description:
      "Masukkan poster, screenshot, link, atau teks lowongan yang terasa mencurigakan. Sistem akan mengekstrak elemen penting untuk telaah risiko awal.",
  },
  {
    number: "2",
    title: "Lihat red flag",
    description:
      "AI menandai indikator mencurigakan: validitas perusahaan, risiko link/kontak, permintaan biaya, dan detail yang perlu diverifikasi.",
  },
  {
    number: "3",
    title: "Ambil langkah aman",
    description:
      "Hasilnya berupa analisis bertahap dan rekomendasi praktis sebelum kamu daftar, mengirim data pribadi, atau melakukan pembayaran.",
  },
];

export function StepsSection() {
  return (
    <section id="cara-kerja" className="mx-auto mb-24 w-full max-w-[1440px] px-4 sm:mb-32 sm:px-8">
      <div className="mb-24 max-w-2xl">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[#5a6a76]">Alur kerja</p>
        <h2 className="font-[var(--font-instrument-serif)] text-[2.45rem] leading-[0.98] text-[#17232c] sm:text-5xl">
          Dirancang untuk telaah risiko lowongan, bukan sekadar vonis.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-14">
        {steps.map((step) => (
          <article key={step.number} className="relative">
            <span className="pointer-events-none absolute -left-2 -top-14 select-none font-[var(--font-instrument-serif)] text-[104px] italic leading-none text-[#2b6f95]/10 sm:text-[116px]">
              {step.number}
            </span>
            <div className="relative pt-8">
              <h3 className="mb-3 font-[var(--font-instrument-serif)] text-[2.15rem] leading-[0.98] text-[#17232c] sm:mb-4">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-[#5a6a76]">{step.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
