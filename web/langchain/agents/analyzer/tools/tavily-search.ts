import type { Reference } from "../schema";

export interface SearchVerificationResult {
  references: Reference[];
  summaryNote?: string;
}

export async function executeWebVerification(query: string): Promise<SearchVerificationResult> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (!tavilyApiKey || !query.trim()) {
    return {
      references: [
        {
          title: "Website & Career Page Resmi Perusahaan",
          snippet:
            "Pastikan lowongan yang sama benar-benar dipublikasikan di kanal resmi perusahaan, bukan hanya di poster/chat forwarding.",
          citations: [],
        },
        {
          title: "LinkedIn Resmi Perusahaan",
          snippet:
            "Gunakan profil resmi untuk mencocokkan nama perusahaan, aktivitas rekrutmen, dan informasi kontak.",
          url: "https://www.linkedin.com",
          citations: [],
        },
        {
          title: "Portal Karirhub Kemnaker",
          snippet:
            "Gunakan sebagai salah satu pembanding lowongan resmi dan informasi ketenagakerjaan yang lebih terstruktur.",
          url: "https://karirhub.kemnaker.go.id",
          citations: [],
        },
      ],
      summaryNote: "Verifikasi standar dilakukan menggunakan pedoman rujukan kanal resmi.",
    };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error HTTP ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    const references: Reference[] = results.map((item: any, index: number) => ({
      title: item.title || `Sumber Verifikasi ${index + 1}`,
      snippet: item.content ? item.content.slice(0, 180) + "..." : undefined,
      url: item.url,
      citations: [
        {
          id: `ref-tavily-${index + 1}`,
          label: `[${index + 1}]`,
          title: item.title || "Sumber Web",
          link: item.url,
        },
      ],
    }));

    return {
      references,
      summaryNote: `Berhasil mengambil ${references.length} referensi web terkini via Tavily Search.`,
    };
  } catch (error) {
    console.error("[WebSearch Tool] Tavily fetch error:", error);
    return {
      references: [
        {
          title: "Website Resmi Perusahaan",
          snippet: "Cocokkan nama perusahaan dan kualifikasi lowongan pada domain resmi.",
          citations: [],
        },
        {
          title: "LinkedIn Resmi Perusahaan",
          snippet: "Cek keberadaan akun resmi dan riwayat postingan karier perusahaan.",
          url: "https://www.linkedin.com",
          citations: [],
        },
      ],
      summaryNote: "Proses pencarian web eksternal mengalami kendala, menggunakan rujukan dasar.",
    };
  }
}
