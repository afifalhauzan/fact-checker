import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/utils/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

// Inter font configuration - Following guide-ui.md specifications
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "METABOT AI - Analytics Dashboard",
  description:
    "Professional analytics dashboard with AI-powered insights and data visualization capabilities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} style={{ scrollbarGutter: "stable both-edges" }}>
      <body className={cn(inter.className, "font-sans antialiased")}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
