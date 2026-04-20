import Link from "next/link";

export function LandingNavbar() {
  const navItems = ["Product", "Philosophy", "Journal"];

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-[#f7f9fb]/80 backdrop-blur-3xl">
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <Link href="/landing" className="font-['Newsreader',serif] text-3xl font-medium tracking-tight text-[#2c3437]">
          FactChecker AI
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navItems.map((item, index) => (
            <Link
              key={item}
              href="#"
              className={
                index === 0
                  ? "text-sm font-medium text-[#4e45e4]"
                  : "text-sm text-[#2c3437]/70 transition-colors duration-300 hover:text-[#4e45e4]"
              }
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/login"
            className="text-sm font-medium text-[#2c3437]/70 transition-colors duration-300 hover:text-[#4e45e4]"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#4e45e4] px-4 py-2 text-sm font-medium text-[#fbf7ff] shadow-[0_12px_25px_rgba(78,69,228,0.25)] transition hover:brightness-110 sm:px-6 sm:py-2.5"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
