import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logo.svg";

export function LandingNavbar() {
  const navItems = [
    { label: "Produk", href: "#produk" },
    { label: "Cara kerja", href: "#cara-kerja" },
    { label: "Untuk Jobseeker", href: "#produk" },
  ];

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-background/85 backdrop-blur-3xl">
      <div className="mx-auto flex h-18 w-full max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src={Logo}
            alt="RiskCheck Loker"
            width={200}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                index === 0
                  ? "text-sm font-medium text-[#2b6f95]"
                  : "text-sm text-[#17232c]/70 transition-colors duration-300 hover:text-[#2b6f95]"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/login"
            className="text-sm font-medium text-[#17232c]/70 transition-colors duration-300 hover:text-[#2b6f95]"
          >
            Masuk
          </Link>
          <Link
            href="/chat"
            className="rounded-md bg-[#2b6f95] px-4 py-2 text-sm font-medium text-[#f8fbff] shadow-[0_12px_25px_rgba(43,111,149,0.18)] transition hover:bg-[#215875] sm:px-6 sm:py-2.5"
          >
            Mulai Telaah
          </Link>
        </div>
      </div>
    </nav>
  );
}
