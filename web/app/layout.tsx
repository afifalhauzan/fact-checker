import "./globals.css";
import { Geist, Instrument_Serif } from "next/font/google";
import { cn } from "@/utils/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata = {
  title: "RiskCheck Loker - Cek Risiko Lowongan Kerja Sebelum Kamu Daftar",
  description:
    "Ruang telaah interaktif untuk menganalisis risiko lowongan kerja digital, mengenali red flag, dan menyusun langkah aman sebelum kirim data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={cn(geist.variable, instrumentSerif.variable)}
      style={{ scrollbarGutter: "stable both-edges" }}
    >
      <body className={cn(geist.className, "font-sans antialiased")}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
