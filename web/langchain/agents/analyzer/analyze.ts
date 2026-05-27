import { AnalysisSchema, type AnalysisResult } from "./schema";
import { analyzerInputPrompt, analyzerSystemPrompt } from "./prompts";
import type { UIActionPayload } from "@/types/ui-actions";
import type { Reference, SalaryBenefitAssessment } from "./schema";

interface AnalyzeInput {
  input: string;
}

function scoreConfidence(text: string): number {
  const lengthFactor = Math.min(text.length / 200, 1);
  return Number((0.62 + lengthFactor * 0.28).toFixed(2));
}

export interface MockUIActionResult {
  openingText: string;
  title: string;
  points: string[];
  closingText: string;
  references?: Reference[];
  salaryBenefit?: SalaryBenefitAssessment;
}

export function handleMockUIAction(actionPayload: UIActionPayload): MockUIActionResult {
  switch (actionPayload.actionId) {
    case "validate_company":
      return {
        openingText:
          "Siap, kita fokus dulu ke validasi perusahaan supaya kamu tidak hanya bergantung pada poster atau chat recruiter.",
        title: "Checklist Validasi Perusahaan",
        points: [
          "Cari website resmi perusahaan lalu cek apakah nama brand, logo, dan alamatnya konsisten dengan lowongan.",
          "Pastikan posisi yang sama muncul di halaman karier resmi atau akun LinkedIn resmi perusahaan.",
          "Cocokkan domain email recruiter. Domain gratis atau domain yang mirip tapi tidak sama perlu diwaspadai.",
          "Jika lowongan hanya muncul di kanal tidak resmi, anggap statusnya masih perlu verifikasi lanjutan.",
        ],
        closingText:
          "Status saat ini: belum ada bukti kuat dari kanal resmi pada analisis awal, jadi jangan kirim data sensitif dulu.",
        references: [
          {
            title: "Website Resmi Perusahaan (yang diklaim pada poster)",
            snippet: "Bandingkan identitas perusahaan dan cek apakah posisi yang sama benar-benar dipublikasikan.",
            citations: [],
          },
          {
            title: "LinkedIn Resmi Perusahaan",
            snippet: "Cek keberadaan profil resmi, aktivitas terbaru, dan konsistensi informasi lowongan.",
            url: "https://www.linkedin.com",
            citations: [],
          },
        ],
      };

    case "check_red_flags":
      return {
        openingText:
          "Baik, saya rangkum red flag utama yang biasanya paling sering muncul pada lowongan digital mencurigakan.",
        title: "Indikator Mencurigakan yang Perlu Diwaspadai",
        points: [
          "Ada permintaan biaya administrasi, biaya pelatihan, atau biaya seragam sebelum proses rekrutmen jelas.",
          "Kontak rekrutmen menggunakan nomor personal dan mendorong komunikasi cepat di WhatsApp/Telegram.",
          "Gaji dan benefit terlihat terlalu tinggi, tetapi deskripsi kerja, alamat kantor, atau detail HR minim.",
          "Ada tekanan waktu berlebihan seperti batas daftar sangat mendesak agar kandidat tidak sempat verifikasi.",
          "Permintaan data pribadi sensitif (KTP, selfie KTP, data keluarga) diminta terlalu awal.",
        ],
        closingText:
          "Semakin banyak indikator ini muncul bersamaan, semakin tinggi risiko lowongan tersebut. Tetap perlakukan sebagai risiko, bukan vonis final.",
      };

    case "check_link_contact":
      return {
        openingText:
          "Oke, kita bedah link dan kanal kontaknya karena ini titik yang paling sering dipakai untuk social engineering.",
        title: "Analisis Risiko Link & Kontak",
        points: [
          "Link shortener dan form eksternal bukan bukti scam, tapi wajib diverifikasi karena mudah dipalsukan.",
          "Jika kandidat langsung diarahkan ke chat personal tanpa kanal resmi, risikonya naik.",
          "Email dari domain publik (mis. @gmail.com) untuk rekrutmen perusahaan besar perlu diuji ulang.",
          "Jangan isi form yang meminta data sensitif sebelum kamu memastikan asal domain dan identitas recruiter.",
        ],
        closingText:
          "Jika link dan kontak tidak bisa ditautkan ke kanal resmi perusahaan, tahan dulu proses pendaftaran.",
      };

    case "check_salary_benefit_reasonableness":
      return {
        openingText:
          "Saya akan mengecek apakah klaim gaji dan benefit pada lowongan ini terlihat wajar dibandingkan pola lowongan sejenis.",
        title: "Checklist Kewajaran Gaji & Benefit",
        points: [
          "Benefit terlihat menarik, tapi detail tanggung jawab dan target kerja masih minim.",
          "Sistem kontrak, masa probation, dan struktur kompensasi belum dijelaskan secara transparan.",
          "Klaim nominal tinggi untuk entry-level perlu pembanding dari lowongan resmi yang setara.",
          "Perlu verifikasi silang ke kanal resmi perusahaan atau platform kerja tepercaya.",
        ],
        salaryBenefit: {
          title: "Kewajaran Gaji & Benefit",
          status: "Perlu Diverifikasi",
          summary:
            "Benefit terlihat menarik, tetapi belum didukung detail role, kontrak, dan kanal resmi. Sebaiknya cek pembanding di situs lowongan tepercaya, website perusahaan, atau akun HR resmi sebelum mengirim data pribadi.",
          highlights: [
            "Klaim benefit: tinggi / sangat menarik",
            "Kejelasan role: belum lengkap",
            "Kejelasan kontrak: belum terlihat",
            "Catatan: bandingkan dengan lowongan resmi atau platform kerja tepercaya",
          ],
          hint:
            "Benefit tinggi bukan otomatis penipuan, tetapi red flag jika digabung dengan chat personal, tekanan cepat daftar, atau permintaan biaya/data pribadi.",
        },
        closingText:
          "Ini indikasi awal, bukan hitungan gaji presisi. Tetap verifikasi ke sumber pasar kerja dan kanal resmi perusahaan.",
      };

    case "safe_next_steps":
      return {
        openingText:
          "Siap, ini langkah aman praktis yang bisa kamu lakukan sebelum ambil keputusan lanjut daftar.",
        title: "Langkah Aman Sebelum Bertindak",
        points: [
          "Jangan bayar biaya apa pun untuk alasan administrasi, pelatihan, seragam, atau jaminan kerja.",
          "Jangan kirim KTP, OTP, nomor rekening, atau data sensitif sebelum kanal resmi terverifikasi.",
          "Cek ulang lowongan di website resmi perusahaan dan kanal resmi karier.",
          "Hubungi kontak resmi perusahaan (bukan hanya nomor di poster) untuk konfirmasi lowongan.",
          "Simpan poster, chat, dan link sebagai bukti jika kamu sudah sempat berinteraksi.",
        ],
        closingText:
          "Dengan langkah ini, kamu bisa menurunkan risiko tertipu tanpa harus langsung mengambil keputusan ekstrem.",
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
  await analyzerInputPrompt.format({ input: input || "" });
  void analyzerSystemPrompt;

  const trimmed = input.trim();

  const mockResult: AnalysisResult = {
    conversationText: trimmed
      ? "Saya sudah melakukan analisis risiko awal pada lowongan ini. Hasil berikut membantu kamu mengenali indikator mencurigakan sebelum daftar, kirim data, atau melakukan pembayaran."
      : "Belum ada input lowongan yang bisa dianalisis. Tempel teks, link, atau deskripsi poster lowongan terlebih dahulu.",

    claims: trimmed
      ? [
          {
            text: "Tingkat Risiko Awal: Tinggi. Ada kombinasi indikator yang perlu diverifikasi sebelum kamu melanjutkan proses.",
            confidence: scoreConfidence(trimmed),
          },
        ]
      : [
          {
            text: "Belum ada informasi lowongan yang cukup untuk menentukan tingkat risiko awal.",
            confidence: 0.2,
          },
        ],

    salaryBenefit: trimmed
      ? {
          title: "Kewajaran Gaji & Benefit",
          status: "Perlu Diverifikasi",
          summary:
            "Gaji atau benefit yang ditawarkan terlihat menarik untuk posisi entry-level, tetapi detail tanggung jawab, sistem kontrak, dan proses seleksi belum cukup jelas. Jika nominal gaji jauh di atas ekspektasi pasar tanpa penjelasan kualifikasi yang memadai, ini bisa menjadi sinyal untuk verifikasi lebih lanjut.",
          highlights: [
            "Klaim benefit: tinggi / sangat menarik",
            "Kejelasan role: belum lengkap",
            "Kejelasan kontrak: belum terlihat",
            "Catatan: bandingkan dengan lowongan resmi atau platform kerja tepercaya",
          ],
          hint:
            "Benefit tinggi bukan otomatis penipuan, tetapi menjadi red flag jika digabung dengan chat personal, tekanan cepat daftar, atau permintaan biaya/data pribadi.",
        }
      : undefined,

    risks: trimmed
      ? [
          {
            type: "overclaim",
            description:
              "Penawaran benefit dan gaji terlihat sangat menarik, tetapi detail tugas, kontrak, dan jalur seleksi tidak dijelaskan dengan memadai.",
          },
          {
            type: "missing_context",
            description:
              "Informasi tentang identitas perusahaan, alamat kantor, dan profil HR resmi belum cukup jelas pada materi lowongan awal.",
          },
          {
            type: "bias",
            description:
              "Ada dorongan keputusan cepat (deadline singkat/ajakan chat personal) yang berisiko membuat kandidat melewatkan proses verifikasi.",
          },
          {
            type: "missing_context",
            description:
              "Terdapat sinyal permintaan data pribadi atau biaya di tahap awal tanpa penjelasan proses rekrutmen yang transparan.",
          },
        ]
      : [
          {
            type: "missing_context",
            description: "Masukkan informasi lowongan lebih lengkap agar indikator risiko bisa dianalisis.",
          },
        ],

    summary: trimmed
      ? "Ringkasan lowongan: posisi yang ditawarkan terlihat ditujukan untuk kandidat entry-level dengan klaim benefit tinggi. Kanal kontak utama mengarah ke chat personal dan pendaftaran melalui kanal eksternal. Beberapa detail penting seperti legalitas perusahaan, domain email resmi, serta mekanisme seleksi belum terlihat kuat. Catatan: ini adalah analisis risiko awal, bukan vonis final penipuan."
      : "Belum ada ringkasan karena sistem belum menerima materi lowongan yang dapat dibedah.",

    summaryCitations: [],

    explanations: trimmed
      ? [
          {
            title: "Validitas Perusahaan",
            explanation:
              "Nama perusahaan yang diklaim di lowongan perlu dicek ulang ke website resmi, halaman karier, LinkedIn resmi, dan konsistensi domain email. Pada analisis awal ini, statusnya masih perlu verifikasi lanjutan.",
          },
          {
            title: "Risiko Link & Kontak",
            explanation:
              "Kanal pendaftaran yang memakai shortlink/form eksternal serta perpindahan cepat ke WhatsApp/Telegram meningkatkan risiko social engineering. Verifikasi domain dan identitas recruiter dulu sebelum isi data.",
          },
          {
            title: "Langkah Aman",
            explanation:
              "Jangan bayar biaya apa pun, jangan kirim KTP/OTP/data sensitif di tahap awal, cek lowongan di kanal resmi perusahaan, dan simpan bukti percakapan jika sudah terlanjur kontak.",
          },
        ]
      : [
          {
            title: "Butuh Materi Lowongan",
            explanation: "Tempel teks, link, atau deskripsi poster lowongan agar sistem bisa menampilkan analisis risiko awal.",
          },
        ],

    suggestedQuestions: [
      "Bantu cek red flag dari tawaran kerja ini.",
      "Periksa apakah perusahaan dan link pendaftarannya valid.",
      "Apakah wajar kalau recruiter meminta biaya administrasi?",
      "Apa langkah aman sebelum saya kirim data pribadi?",
    ],

    reasoning: trimmed
      ? [
          {
            intent: "Membantu pengguna melakukan telaah risiko lowongan kerja digital secara bertahap",
            steps: [
              "Mengidentifikasi elemen inti lowongan: posisi, nama perusahaan, kanal pendaftaran, dan kontak recruiter",
              "Menandai indikator mencurigakan seperti biaya awal, tekanan deadline, serta ketidakjelasan identitas perusahaan",
              "Mengevaluasi risiko dari link pendaftaran, domain email, dan perpindahan komunikasi ke chat personal",
              "Menyusun tingkat risiko awal tanpa memberikan vonis absolut",
              "Memberikan langkah aman yang bisa dilakukan pengguna sebelum melanjutkan proses rekrutmen",
            ],
          },
        ]
      : undefined,

    references: trimmed
      ? [
          {
            title: "Sumber yang Sebaiknya Dicek: Website & Career Page Resmi Perusahaan",
            snippet:
              "Pastikan lowongan yang sama benar-benar dipublikasikan di kanal resmi perusahaan, bukan hanya di poster/chat forwarding.",
            citations: [],
          },
          {
            title: "Sumber yang Sebaiknya Dicek: LinkedIn Resmi Perusahaan",
            snippet:
              "Gunakan profil resmi untuk mencocokkan nama perusahaan, aktivitas rekrutmen, dan informasi kontak.",
            url: "https://www.linkedin.com",
            citations: [],
          },
          {
            title: "Sumber yang Sebaiknya Dicek: Portal Karirhub Kemnaker",
            snippet:
              "Gunakan sebagai salah satu pembanding lowongan resmi dan informasi ketenagakerjaan yang lebih terstruktur.",
            url: "https://karirhub.kemnaker.go.id",
            citations: [],
          },
        ]
      : [],
  };

  return AnalysisSchema.parse(mockResult);
}
