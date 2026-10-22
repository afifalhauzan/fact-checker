import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface VerificationSource {
  category: string;
  name: string;
  description: string;
  href: string;
  logo: string;
}

const sources: VerificationSource[] = [
  {
    category: "Pemeriksaan Fakta",
    name: "TurnBackHoax",
    description:
      "Database hasil pemeriksaan fakta MAFINDO, termasuk konten yang dikategorikan sebagai penipuan. Cocok untuk mencari apakah klaim atau modus serupa pernah diperiksa.",
    href: "https://turnbackhoax.id",
    logo: "/turnbackhoax.jpg",
  },
  {
    category: "Pemeriksaan Fakta",
    name: "CekFakta.com",
    description:
      "Portal kolaborasi pemeriksa fakta yang diinisiasi MAFINDO, AJI, dan AMSI. Berguna untuk mencari klaim atau informasi yang sudah pernah diverifikasi.",
    href: "https://cekfakta.com",
    logo: "/cekfakta.png",
  },
  {
    category: "Referensi Lowongan Kerja",
    name: "Karirhub Kemnaker",
    description:
      "Layanan pasar kerja resmi Kemnaker untuk mencari lowongan dan membandingkan informasi rekrutmen. Tidak ditemukannya suatu lowongan di sini bukan bukti bahwa lowongan tersebut palsu.",
    href: "https://karirhub.kemnaker.go.id",
    logo: "/karirhub_lower_08c3886bd0_6e9a9ee711.svg",
  },
  {
    category: "Pelaporan Konten",
    name: "Aduan Konten",
    description:
      "Layanan pemerintah untuk melaporkan URL, situs web, akun media sosial, dan konten yang memenuhi kriteria pelaporan. Ini kanal pelaporan, bukan mesin verifikasi lowongan otomatis.",
    href: "https://aduankonten.id",
    logo: "/aduan-konten.png",
  },
];

export function SourcesSection() {
  return (
    <section id="sumber-verifikasi" className="mx-auto mb-12 w-full max-w-7xl px-4 sm:mb-16 sm:px-8">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-[var(--font-instrument-serif)] text-[2.45rem] leading-[0.98] text-[#17232c] sm:text-5xl">
          Sumber Verifikasi Tepercaya
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#5a6a76]">
          Periksa kembali informasi lowongan melalui berbagai sumber sebelum mengambil keputusan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sources.map((source) => {
          const host = new URL(source.href).hostname;

          return (
            <a
              key={source.name}
              href={source.href}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col rounded-lg border border-[#17232c]/10 bg-white p-5 shadow-[0_18px_45px_rgba(23,35,44,0.06)] transition-colors hover:border-[#2b6f95]/40 hover:bg-[#2b6f95]/5"
            >
              {/* Logos come in different shapes, so each sits in the same box and is fitted into it */}
              <span className="relative block h-12 w-full">
                <Image
                  src={source.logo}
                  alt={`Logo ${source.name}`}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 80vw"
                  className="object-contain object-left"
                  unoptimized={source.logo.endsWith(".svg")}
                />
              </span>
              <p className="mt-4 text-xs font-medium text-[#5a6a76]">{source.category}</p>
              <h3 className="mt-1 text-base font-semibold leading-snug text-[#17232c]">{source.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5a6a76]">{source.description}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-[#2b6f95]">
                {host}
                <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          );
        })}
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#5a6a76]">
        Gunakan beberapa sumber untuk memeriksa informasi. Tidak ditemukannya suatu lowongan dalam sumber pemeriksaan fakta
        bukan berarti lowongan tersebut pasti aman atau pasti palsu.
      </p>
    </section>
  );
}
