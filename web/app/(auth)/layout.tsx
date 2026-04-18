import { cn } from "@/utils/utils";
import Script from "next/script";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className={cn(inter.variable, "min-h-screen")}>
        <div className="relative min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 overflow-hidden">
          <div className="w-full relative z-10">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
