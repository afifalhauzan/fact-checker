import { CtaSection } from "@/components/landing/cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { PreviewSection } from "@/components/landing/preview-section";
import { StepsSection } from "@/components/landing/steps-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#2c3437] selection:bg-[#6760fd] selection:text-white">
      <LandingNavbar />

      <main className="relative overflow-hidden pb-24 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_0%,rgba(78,69,228,0.07),transparent_42%),radial-gradient(circle_at_100%_0%,rgba(103,96,253,0.1),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(245,205,249,0.16),transparent_46%)]" />

        <HeroSection />
        <PreviewSection />
        <StepsSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
