export function LandingFooter() {
  const links = ["Privacy", "Terms", "Security", "Contact"];

  return (
    <footer className="mt-24 w-full bg-[#f0f4f7] py-10 sm:py-12">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-8 px-4 sm:px-12 md:flex-row md:items-center">
        <div>
          <div className="mb-2 font-['Newsreader',serif] text-2xl text-[#2c3437]">Curator AI</div>
          <p className="text-sm tracking-wide text-[#2c3437]/60">© 2024 Digital Curator. All rights reserved.</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm tracking-wide text-[#2c3437]/60 transition-all duration-200 hover:text-[#4e45e4] hover:underline hover:underline-offset-4"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
