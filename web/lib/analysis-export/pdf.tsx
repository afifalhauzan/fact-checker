// Draws an export as a PDF. This module pulls in @react-pdf/renderer, so callers load it with a
// dynamic import() when the user asks for a PDF, not at page load.
import React from "react";
import { Document, Image, Link, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { RiskLevel } from "../../langchain/agents/analyzer/schema";
import type { AnalysisExport, SourceFile } from "./build";
import { parseMarkdown, type Block, type Inline } from "./markdown";
import { pdfSafe } from "./pdf-text";

const BRAND = "#2b6f95";
const SITE_URL = "https://telaahkarier.com/";
const INK = "#17232c";
const MUTED = "#5a6a76";
const LINE = "#d5dde3";

const LEVEL_COLORS: Record<RiskLevel, { ink: string; tint: string }> = {
  tinggi: { ink: "#b91c1c", tint: "#fef2f2" },
  sedang: { ink: "#b45309", tint: "#fffbeb" },
  rendah: { ink: "#047857", tint: "#ecfdf5" },
};

// A4 is 595pt wide; the page padding leaves this much for content
const CONTENT_WIDTH = 595 - 2 * 44;
const IMAGE_MAX_HEIGHT = 300;
// Posters are photographed at far more pixels than a PDF page shows
const IMAGE_MAX_PX = 1400;
// The header logo is drawn at this height (pt); the PNG made from the SVG has 3x the pixels
const LOGO_HEIGHT = 24;
const LOGO_PIXEL_SCALE = 3;

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 10, color: INK },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: LINE },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 12, color: BRAND },
  logo: { height: LOGO_HEIGHT },
  brandNote: { fontSize: 8.5, color: MUTED },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 20, lineHeight: 1.2, marginBottom: 4 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 13, marginTop: 16, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.75, borderBottomColor: LINE },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 8, marginBottom: 2 },
  // Line heights are set per style: one on the page itself would make the fixed footer disappear
  paragraph: { marginBottom: 6, lineHeight: 1.4 },
  muted: { color: MUTED, fontSize: 9 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  marker: { width: 14, color: MUTED },
  listBody: { flex: 1, lineHeight: 1.4 },
  quote: { borderLeftWidth: 3, borderLeftColor: LINE, backgroundColor: "#f4f7fa", paddingVertical: 6, paddingHorizontal: 10, marginBottom: 8 },
  code: { fontFamily: "Courier", fontSize: 8.5, backgroundColor: "#f4f7fa", padding: 6, marginBottom: 8 },
  rule: { borderBottomWidth: 0.75, borderBottomColor: LINE, marginVertical: 10 },
  imageBox: { borderWidth: 0.75, borderColor: LINE, padding: 4, marginBottom: 8, alignSelf: "flex-start" },
  footerLeft: { position: "absolute", left: 44, bottom: 24, fontSize: 8, color: MUTED },
  footerRight: { position: "absolute", left: 44, right: 44, bottom: 24, fontSize: 8, color: MUTED, textAlign: "right" },
});

export interface PdfImage {
  src: string;
  width: number;
  height: number;
}

function spanStyle(span: Inline) {
  if (span.code) return { fontFamily: "Courier", fontSize: 9 };
  if (span.bold && span.italic) return { fontFamily: "Helvetica-BoldOblique" };
  if (span.bold) return { fontFamily: "Helvetica-Bold" };
  if (span.italic) return { fontFamily: "Helvetica-Oblique" };
  return {};
}

function Spans({ spans }: { spans: Inline[] }) {
  return (
    <>
      {spans.map((span, index) =>
        span.href ? (
          <Link key={index} src={span.href} style={{ ...spanStyle(span), color: BRAND, textDecoration: "underline" }}>
            {pdfSafe(span.text)}
          </Link>
        ) : (
          <Text key={index} style={spanStyle(span)}>
            {pdfSafe(span.text)}
          </Text>
        )
      )}
    </>
  );
}

function fit(image: PdfImage) {
  const scale = Math.min(1, CONTENT_WIDTH / image.width, IMAGE_MAX_HEIGHT / image.height);
  return { width: Math.round(image.width * scale), height: Math.round(image.height * scale) };
}

function BlockView({ block, level, isVerdictQuote, images }: { block: Block; level: RiskLevel | null; isVerdictQuote: boolean; images: Array<PdfImage | null> }) {
  switch (block.type) {
    case "heading": {
      const isVerdict = level !== null && /^tingkat risiko:/i.test(block.spans.map((span) => span.text).join(""));
      const style = block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3;
      return (
        // Keeps a heading from being left alone at the bottom of a page
        <Text style={[style, isVerdict && level ? { color: LEVEL_COLORS[level].ink } : {}]} minPresenceAhead={48}>
          <Spans spans={block.spans} />
        </Text>
      );
    }
    case "paragraph":
      return (
        <Text style={styles.paragraph}>
          <Spans spans={block.spans} />
        </Text>
      );
    case "list":
      return (
        <View style={{ marginBottom: 6 }}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem} wrap={false}>
              <Text style={styles.marker}>{block.ordered ? `${index + 1}.` : "•"}</Text>
              <Text style={styles.listBody}>
                <Spans spans={item} />
              </Text>
            </View>
          ))}
        </View>
      );
    case "quote": {
      const tint = isVerdictQuote && level ? LEVEL_COLORS[level] : null;
      return (
        <View style={[styles.quote, tint ? { borderLeftColor: tint.ink, backgroundColor: tint.tint } : {}]}>
          {block.lines.map((line, index) =>
            line.length === 0 ? (
              <Text key={index} style={{ fontSize: 5 }}>
                {" "}
              </Text>
            ) : (
              <Text key={index} style={tint ? { fontFamily: "Helvetica-Bold", color: tint.ink, lineHeight: 1.4 } : { lineHeight: 1.4 }}>
                <Spans spans={line} />
              </Text>
            )
          )}
        </View>
      );
    }
    case "code":
      return <Text style={styles.code}>{pdfSafe(block.text)}</Text>;
    case "rule":
      return <View style={styles.rule} />;
    case "image": {
      const image = images[Number(block.src.replace("attachment:", ""))];
      // A file that could not be drawn (e.g. an HEIC photo) is named instead
      if (!image) return <Text style={[styles.paragraph, styles.muted]}>{pdfSafe(`[Lampiran: ${block.alt || "file"}]`)}</Text>;
      return (
        <View style={styles.imageBox} wrap={false}>
          <Image src={image.src} style={fit(image)} />
        </View>
      );
    }
  }
}

export function AnalysisPdf({ title, markdown, verdictLevel, images, logo = null }: { title: string; markdown: string; verdictLevel: RiskLevel | null; images: Array<PdfImage | null>; logo?: PdfImage | null }) {
  const blocks = parseMarkdown(markdown);
  // The line under the verdict heading is the advice; it takes the verdict's colour
  const verdictIndex = blocks.findIndex((block) => block.type === "heading" && /^tingkat risiko:/i.test(block.spans.map((span) => span.text).join("")));

  return (
    <Document title={pdfSafe(title)} author="TelaahKarier" creator="TelaahKarier">
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          {logo ? <Image src={logo.src} style={[styles.logo, { width: Math.round((LOGO_HEIGHT * logo.width) / logo.height) }]} /> : <Text style={styles.brand}>TelaahKarier</Text>}
          <Text style={styles.brandNote}>Telaah risiko lowongan kerja</Text>
        </View>

        {blocks.map((block, index) => (
          <BlockView key={index} block={block} level={verdictLevel} isVerdictQuote={index === verdictIndex + 1 && verdictIndex >= 0} images={images} />
        ))}

        <Text style={styles.footerLeft} fixed>
          Dibuat dengan TelaahKarier, coba sekarang!{" "}
          <Link src={SITE_URL} style={{ color: BRAND, textDecoration: "underline" }}>
            {SITE_URL}
          </Link>
        </Text>
        <Text style={styles.footerRight} fixed render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
      </Page>
    </Document>
  );
}

async function toPdfImage(file: SourceFile): Promise<PdfImage | null> {
  if (!file.mediaType.startsWith("image/")) return null;

  try {
    // A data: URL, or a same-origin link to a stored attachment (the session cookie goes along)
    const response = await fetch(file.url);
    if (!response.ok) return null;

    const bitmap = await createImageBitmap(await response.blob());
    const scale = Math.min(1, IMAGE_MAX_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    // JPEG has no transparency; a transparent PNG would turn black
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return { src: canvas.toDataURL("image/jpeg", 0.85), width, height };
  } catch {
    return null;
  }
}

// react-pdf cannot draw SVG, so the logo is painted onto a canvas and used as a PNG (which keeps
// its transparency). Without a logo the header falls back to the brand name.
async function toPdfLogo(): Promise<PdfImage | null> {
  try {
    const { LOGO } = await import("./logo");
    const width = LOGO.width * LOGO_PIXEL_SCALE;
    const height = LOGO.height * LOGO_PIXEL_SCALE;

    const image = new window.Image();
    image.src = LOGO.src;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);

    return { src: canvas.toDataURL("image/png"), width, height };
  } catch {
    return null;
  }
}

export async function renderAnalysisPdf(analysis: AnalysisExport): Promise<Blob> {
  const [images, logo] = await Promise.all([Promise.all(analysis.attachments.map(toPdfImage)), toPdfLogo()]);
  return pdf(<AnalysisPdf title={analysis.title} markdown={analysis.markdown} verdictLevel={analysis.verdictLevel} images={images} logo={logo} />).toBlob();
}

export async function downloadAnalysisPdf(analysis: AnalysisExport, filename: string): Promise<void> {
  const url = URL.createObjectURL(await renderAnalysisPdf(analysis));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
