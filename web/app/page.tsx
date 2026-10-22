import { HeroSection } from "@/components/landing/hero-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PreviewSection } from "@/components/landing/preview-section";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { SourcesSection } from "@/components/landing/sources-section";
import { StepsSection } from "@/components/landing/steps-section";
import { TrendingSection } from "@/components/landing/trending-section";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-[#17232c] selection:bg-[#2b6f95] selection:text-white">
      <SmoothScroll />
      <ProtectedTopNavbar />

      <main className="relative overflow-hidden pb-6 pt-14 sm:pt-8">
        <HeroSection />
        <PreviewSection />
        <TrendingSection />
        <StepsSection />
        <SourcesSection />
      </main>

      <LandingFooter />
    </div>
  );
}
