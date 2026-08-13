import { getLLMModel } from "./llm";
import { actionPromptTemplates } from "./prompts";
import type { UIActionPayload } from "@/types/ui-actions";
import type { Reference, SalaryBenefitAssessment } from "./schema";

export interface MockUIActionResult {
  openingText: string;
  title: string;
  points: string[];
  closingText: string;
  references?: Reference[];
  salaryBenefit?: SalaryBenefitAssessment;
}

export async function handleRealUIAction(actionPayload: UIActionPayload): Promise<MockUIActionResult> {
  const actionId = actionPayload.actionId;
  const context = actionPayload.context || actionPayload.claim || "Informasi lowongan kerja digital";

  const template = actionPromptTemplates[actionId];

  if (!template) {
    return {
      openingText: "Saya akan memproses aksi yang kamu pilih.",
      title: "Aksi Investigasi",
      points: [
        "Aksi telah diterima oleh sistem.",
        "Silakan lakukan verifikasi lebih lanjut ke kanal resmi perusahaan.",
      ],
      closingText: "Silakan lanjutkan dengan aksi lain jika diperlukan.",
    };
  }

  try {
    const llm = getLLMModel({ temperature: 0.2 });
    const prompt = template.replace("{context}", context);

    const response = await llm.invoke([
      {
        role: "system",
        content:
          "Anda adalah asisten investigasi risiko lowongan kerja digital. Berikan panduan analisis yang ringkas, logis, dan berbentuk poin-poin yang mudah dipahami.",
      },
      { role: "user", content: prompt },
    ]);

    const contentStr = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    // Extract bullet points from LLM response
    const rawLines = contentStr.split("\n").map((line) => line.trim()).filter(Boolean);
    const points: string[] = [];

    for (const line of rawLines) {
      const cleanLine = line.replace(/^[*\-•\d+.\s]+/, "").trim();
      if (cleanLine.length > 10 && !cleanLine.startsWith("Judul:") && !cleanLine.startsWith("Status:")) {
        points.push(cleanLine);
      }
    }

    const finalPoints = points.length >= 3 ? points.slice(0, 5) : [
      "Periksa keberadaan website resmi dan domain email recruiter.",
      "Cocokkan posisi yang sama pada halaman karier atau LinkedIn resmi.",
      "Waspadai kontak personal WhatsApp atau permintaan biaya di awal.",
      "Tahan pengiriman dokumen sensitif (KTP/rekening) sebelum verifikasi.",
    ];

    if (actionId === "check_salary_benefit_reasonableness") {
      return {
        openingText: "Saya telah menganalisis kewajaran gaji dan benefit berdasarkan informasi posisi ini.",
        title: "Checklist Kewajaran Gaji & Benefit",
        points: finalPoints,
        salaryBenefit: {
          title: "Kewajaran Gaji & Benefit",
          status: "Perlu Diverifikasi",
          summary:
            "Klaim nominal gaji atau benefit yang ditawarkan perlu dibandingkan dengan standar industri untuk posisi sejenis.",
          highlights: [
            "Klaim benefit: perlu pengecekan pasar",
            "Kejelasan role & tanggung jawab: harus dipastikan di wawancara",
            "Sistem kontrak: pastikan ada dokumen tertulis",
          ],
          hint:
            "Penawaran tinggi bukan otomatis penipuan, namun menjadi sinyal bahaya bila disertai permintaan pembayaran atau chat personal.",
        },
        closingText:
          "Hasil ini adalah pembanding awal. Selalu verifikasi ke platform karier tepercaya atau situs resmi perusahaan.",
      };
    }

    return {
      openingText: `Siap, ini hasil pendalaman untuk **${actionPayload.actionLabel || "aksi yang kamu pilih"}**:`,
      title: getActionTitle(actionId),
      points: finalPoints,
      closingText: "Jika ada aspek lain yang ingin kamu cek, pilih tombol aksi lainnya di bawah.",
      references: [
        {
          title: "Website Resmi Perusahaan",
          snippet: "Bandingkan informasi lowongan dan pastikan dipublikasikan di kanal korporat resmi.",
          citations: [],
        },
        {
          title: "LinkedIn Resmi Perusahaan",
          snippet: "Cek keberadaan profil resmi, aktivitas terbaru, dan konsistensi informasi recruiter.",
          url: "https://www.linkedin.com",
          citations: [],
        },
      ],
    };
  } catch (error) {
    console.error("[ActionHandler] Error generating real UI Action response:", error);
    // Fallback to safe response
    return {
      openingText: "Berikut adalah langkah investigasi yang direkomendasikan:",
      title: getActionTitle(actionId),
      points: [
        "Cari website resmi perusahaan lalu cek apakah nama brand, logo, dan alamatnya konsisten.",
        "Pastikan posisi yang sama muncul di halaman karier resmi atau akun LinkedIn resmi perusahaan.",
        "Cocokkan domain email recruiter. Domain gratis (@gmail/@yahoo) perlu diwaspadai.",
        "Jika lowongan meminta pembayaran biaya administrasi/modul, segera hentikan proses pendaftaran.",
      ],
      closingText: "Selalu utamakan prinsip kehati-hatian sebelum mengirimkan data pribadi.",
    };
  }
}

function getActionTitle(actionId: string): string {
  switch (actionId) {
    case "validate_company":
      return "Checklist Validasi Perusahaan";
    case "check_red_flags":
      return "Indikator Mencurigakan yang Perlu Diwaspadai";
    case "check_link_contact":
      return "Analisis Risiko Link & Kontak";
    case "check_salary_benefit_reasonableness":
      return "Checklist Kewajaran Gaji & Benefit";
    case "safe_next_steps":
      return "Langkah Aman Sebelum Bertindak";
    default:
      return "Aksi Investigasi Lanjutan";
  }
}
