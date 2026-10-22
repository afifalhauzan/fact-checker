import Logo from "@/assets/logo.svg";

// Kept apart from pdf.tsx so that module stays free of "@/" and asset imports (the tests load it
// with jiti). Next turns a static SVG import into { src, width, height }.
export const LOGO = Logo as unknown as { src: string; width: number; height: number };
