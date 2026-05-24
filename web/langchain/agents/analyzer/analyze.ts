import { AnalysisSchema, type AnalysisResult } from "./schema";
import { analyzerInputPrompt, analyzerSystemPrompt } from "./prompts";
import type { UIActionPayload } from "@/types/ui-actions";
import type { Reference } from "./schema";

interface AnalyzeInput {
  input: string;
}

function scoreConfidence(text: string): number {
  const lengthFactor = Math.min(text.length / 160, 1);
  return Number((0.55 + lengthFactor * 0.35).toFixed(2));
}

export interface MockUIActionResult {
  openingText: string;
  title: string;
  points: string[];
  closingText: string;
  references?: Reference[];
}

export function handleMockUIAction(actionPayload: UIActionPayload): MockUIActionResult {
  switch (actionPayload.actionId) {
    case "inspect_source":
      return {
        openingText: "Saya akan memeriksa sumber dan asal informasi yang terkait dengan klaim ini.",
        title: "Pemeriksaan Sumber",
        points: [
          "Sumber awal berasal dari input yang diberikan pengguna.",
          "Informasi dari gambar atau teks awal belum otomatis berarti valid.",
          "Perlu dicocokkan dengan sumber resmi, tanggal publikasi, dan identitas penyelenggara atau penerbit.",
        ],
        closingText:
          "Langkah paling aman adalah membandingkan informasi ini dengan kanal resmi atau sumber primer.",
        references: [
          {
            title: "Panduan Verifikasi Informasi Publik",
            snippet: "Pastikan identitas penerbit, tanggal publikasi, dan dokumen primer sebelum menyimpulkan validitas.",
            url: "https://example.com/verification/public-info-checklist",
            citations: [
              {
                id: "inspect-source-citation-1",
                label: "[1]",
                title: "Panduan Verifikasi Informasi Publik",
                link: "https://example.com/verification/public-info-checklist",
              },
            ],
          },
        ],
      };

    case "expand_context":
      return {
        openingText: "Saya akan mencari konteks yang mungkin belum terlihat dari informasi awal.",
        title: "Konteks yang Perlu Dilengkapi",
        points: [
          "Siapa pihak resmi yang menerbitkan informasi ini?",
          "Apakah ada tautan resmi atau dokumen pendukung?",
          "Kapan informasi ini berlaku?",
          "Apakah ada syarat, biaya, atau batasan yang belum terlihat?",
        ],
        closingText: "Tanpa konteks ini, informasi sebaiknya belum langsung dianggap lengkap.",
      };

    case "challenge_claim":
      return {
        openingText:
          "Saya akan menguji klaim ini dengan mencari kemungkinan bantahan atau titik lemah informasinya.",
        title: "Uji Klaim",
        points: [
          "Klaim perlu diuji apakah berasal dari sumber resmi.",
          "Perlu diperiksa apakah gambar atau teks sudah dipotong dari konteks aslinya.",
          "Perlu dicek apakah ada informasi lama yang disebarkan ulang.",
          "Perlu dibedakan antara klaim utama, promosi, dan interpretasi pembaca.",
        ],
        closingText:
          "Tujuan dari tahap ini bukan langsung menyatakan salah, tetapi mencegah informasi diterima mentah-mentah.",
      };

    case "simplify_explanation":
      return {
        openingText: "Saya akan menyederhanakan analisis ini menjadi bahasa yang lebih mudah dipahami.",
        title: "Penjelasan Sederhana",
        points: [
          "Informasi ini belum bisa langsung dipercaya hanya dari satu gambar atau satu teks.",
          "Yang perlu dicek adalah siapa pembuatnya, apakah ada sumber resmi, dan apakah detailnya lengkap.",
          "Kalau sumbernya jelas dan bisa diverifikasi, risikonya lebih rendah.",
          "Kalau sumbernya tidak jelas, sebaiknya jangan langsung disebarkan.",
        ],
        closingText:
          "Intinya: pahami dulu sumber dan konteksnya sebelum percaya atau membagikan informasi.",
      };

    default:
      return {
        openingText: "Saya akan menjalankan aksi yang kamu pilih.",
        title: "Aksi Lanjutan",
        points: [
          "Aksi diterima oleh sistem.",
          "Alur ini masih mock dan siap diganti node LangGraph di tahap berikutnya.",
        ],
        closingText: "Silakan lanjutkan dengan aksi lain jika perlu.",
      };
  }
}

export async function analyzeContent({ input }: AnalyzeInput): Promise<AnalysisResult> {
  // Keep a LangChain-ready prompt path now, while still returning mock data.
  await analyzerInputPrompt.format({ input: input || "" });
  void analyzerSystemPrompt;

  const trimmed = input.trim();

  const mockResult: AnalysisResult = {
  conversationText: trimmed
    ? "Berikut analisis cek fakta terkait klaim bahwa barang-barang rumah tangga dapat menyebabkan kanker:"
    : "No input provided for analysis.",

  claims: trimmed
    ? [
        {
          text: "Sejumlah barang rumah tangga seperti pengharum ruangan, wadah plastik, peralatan masak anti lengket, talenan plastik, makanan kaleng, detergen tertentu, obat nyamuk, dan lilin aromaterapi diklaim dapat menyebabkan kanker.",
          confidence: scoreConfidence(trimmed),
        },
      ]
    : [
        {
          text: "No clear claim detected from the input.",
          confidence: 0.2,
        },
      ],

  risks: trimmed
    ? [
        {
          type: "overclaim",
          description:
            "Klaim ini berisiko terlalu menyederhanakan hubungan antara paparan bahan kimia rumah tangga dan kanker. Tidak semua barang rumah tangga mengandung zat berisiko, dan tingkat paparan sehari-hari umumnya rendah.",
        },
        {
          type: "missing_context",
          description:
            "Klaim tidak membedakan antara penggunaan normal, paparan dosis tinggi, jenis bahan tertentu, kondisi rusak atau panas ekstrem, serta bukti ilmiah pada manusia.",
        },
      ]
    : [
        {
          type: "overclaim",
          description:
            "There is no information to evaluate, so any conclusion would be unreliable.",
        },
      ],

  summary: trimmed
    ? "Klaim bahwa barang-barang rumah tangga secara umum dapat menyebabkan kanker bersifat menyesatkan jika disampaikan tanpa konteks. Beberapa benda memang dapat mengandung bahan kimia tertentu, seperti BPA, phthalates, VOC, PTFE, atau insektisida, tetapi risiko kanker bergantung pada jenis bahan, dosis paparan, cara penggunaan, dan durasi paparan. Dalam penggunaan rumah tangga yang normal dan sesuai aturan, hubungan langsung dengan kanker pada manusia belum terbukti kuat."
    : "We could not find a clear idea to analyze. Try entering a statement or claim.",

  summaryCitations: trimmed
    ? [
        {
          id: "summary-citation-1",
          label: "[1]",
          title: "Sukabumi Update - Cek Fakta Barang Rumah Tangga dan Risiko Kanker",
          link: "https://sukabumiupdate.com",
        },
        {
          id: "summary-citation-2",
          label: "[2]",
          title: "Tempo.co - Verifikasi Klaim Barang Rumah Tangga Penyebab Kanker",
          link: "https://tempo.co",
        },
      ]
    : [],

    explanations: trimmed
    ? [
        {
          title: "Gambaran Umum Klaim",
          explanation:
            "Klaim menyebut bahwa banyak barang rumah tangga umum bisa menyebabkan kanker. Intinya, klaim ini perlu dibaca dengan konteks paparan dan kualitas sumber.",
        },
        {
          title: "Konteks Risiko Nyata",
          explanation:
            "Tidak semua barang memiliki tingkat risiko yang sama. Risiko dipengaruhi jenis bahan, dosis, cara penggunaan, suhu, kondisi produk, serta durasi paparan.",
        },
        {
          title: "Kesimpulan Praktis",
          explanation:
            "Lebih tepat menyebut bahwa ada bahan kimia tertentu yang perlu diwaspadai, bukan menyimpulkan semua barang rumah tangga sebagai penyebab kanker.",
        },
      ]
    : [
        {
          title: "Butuh Input Lebih Jelas",
          explanation: "Coba kirim pernyataan atau pertanyaan yang lebih spesifik supaya analisisnya bisa lebih tepat.",
        },
      ],

  suggestedQuestions: [
    "Apa perbedaan antara zat berbahaya dan paparan berbahaya?",
    "Barang rumah tangga apa yang perlu digunakan dengan lebih hati-hati?",
    "Bagaimana cara mengurangi paparan bahan kimia di rumah tanpa panik berlebihan?",
  ],

  reasoning: trimmed
    ? [
        {
          intent: "Menganalisis klaim kesehatan viral tentang barang rumah tangga dan risiko kanker",
          steps: [
            "Mengidentifikasi klaim utama dari unggahan media sosial",
            "Memisahkan daftar barang rumah tangga dari kesimpulan bahwa semuanya menyebabkan kanker",
            "Mengecek konteks paparan, dosis, jenis bahan, dan cara penggunaan",
            "Membandingkan klaim viral dengan penjelasan ahli onkologi dan sumber cek fakta",
            "Menyimpulkan bahwa klaim mengandung sebagian kekhawatiran yang masuk akal, tetapi terlalu luas jika disebut sebagai penyebab kanker secara langsung",
          ],
        },
      ]
    : undefined,

  references: trimmed
    ? [
        {
          title: "Sukabumi Update - Cek Fakta Barang Rumah Tangga dan Risiko Kanker",
          snippet:
            "Artikel membahas klaim viral bahwa barang rumah tangga seperti plastik, pengharum ruangan, teflon, makanan kaleng, detergen, obat nyamuk, dan lilin aromaterapi dapat menyebabkan kanker, lalu menjelaskan konteks risikonya berdasarkan verifikasi Tempo dan ahli onkologi.",
          url: "https://sukabumiupdate.com",
          citations: [
            {
              id: "reference-citation-1",
              label: "[1]",
              title: "Sukabumi Update - Cek Fakta Barang Rumah Tangga dan Risiko Kanker",
              link: "https://sukabumiupdate.com",
            },
          ],
        },
        {
          title: "Tempo.co - Verifikasi Klaim Barang Rumah Tangga Penyebab Kanker",
          snippet:
            "Tempo memverifikasi klaim dengan mewawancarai dokter spesialis onkologi dan merujuk berbagai sumber kredibel. Hasilnya, hubungan penggunaan normal barang rumah tangga dengan kanker belum terbukti kuat.",
          url: "https://tempo.co",
          citations: [
            {
              id: "reference-citation-2",
              label: "[2]",
              title: "Tempo.co - Verifikasi Klaim Barang Rumah Tangga Penyebab Kanker",
              link: "https://tempo.co",
            },
          ],
        },
      ]
    : [],
};

  return AnalysisSchema.parse(mockResult);
}

