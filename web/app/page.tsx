import { CtaSection } from "@/components/landing/cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { PreviewSection } from "@/components/landing/preview-section";
import { StepsSection } from "@/components/landing/steps-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-[#17232c] selection:bg-[#2b6f95] selection:text-white">
      <LandingNavbar />

      <main className="relative overflow-hidden pb-24 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-[#17232c]/10" />
        <HeroSection />
        <PreviewSection />
        <StepsSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
