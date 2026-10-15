/**
 * Fills empty `text` cells from each row's source page and takes screenshots for image rows
 * whose source is an official posting page. Rows it fills get a note in `catatan`, so the
 * second checker knows to compare them with the source. Anything it cannot read is left
 * for manual copying and listed at the end.
 *
 *   pnpm exec jiti eval/fill-dataset.ts [--dry-run] [--refill] [--ids P015,A031]
 *
 * --dry-run fetches and extracts but prints only lengths and writes nothing.
 * --refill extracts again for rows this script filled before (after an extractor fix).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseCsv } from "./lib/csv";

const CSV_PATH = resolve("eval/dataset/dataset.csv");
const IMAGES_DIR = resolve("eval/dataset/images");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const AUTO_NOTE = "[Teks diisi otomatis: cocokkan dengan sumber.]";
const AUTO_IMAGE_NOTE = "[Screenshot diambil otomatis: cek isinya.]";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const idsArg = args[args.indexOf("--ids") + 1];
const onlyIds = args.includes("--ids") && idsArg ? new Set(idsArg.split(",")) : null;

const decode = (s: string) =>
  s
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#8217;/g, "'")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”");

/** HTML to plain text that keeps paragraph and line breaks. */
function htmlToText(html: string): string {
  return decode(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

/**
 * The posting inside a fact-check's "Narasi" section. Usually it is quoted between the first “
 * and the last ”; when the only quotes wrap an account name, the posting is the paragraphs
 * after the intro, minus a closing remark about the post's reach.
 */
function turnbackhoaxNarasi(html: string): string | null {
  const section = html.match(/<section class="article-origin[\s\S]*?<\/section>/)?.[0];
  if (!section) return null;
  const text = htmlToText(section).replace(/^Narasi\s*/, "");
  // Quotes before "narasi:" usually wrap the account name, so start at the quote after it.
  const lead = text.search(/(narasi|takarir|keterangan|berbunyi|berikut)[^“\n]{0,25}:/i);
  const start = text.indexOf("“", lead >= 0 ? lead : 0);
  const end = text.lastIndexOf("”");
  if (start >= 0 && end - start > 80) return text.slice(start + 1, end).trim();

  const paragraphs = text.split("\n").filter(Boolean);
  if (paragraphs.length < 2) return null;
  const body = paragraphs.slice(1);
  if (/^(Hingga|Sampai|Per |Unggahan (tersebut|itu)|Pada (saat|waktu))/.test(body[body.length - 1])) body.pop();
  return body.join("\n").replace(/^“|”$/g, "").replace(/^NARASI\s*:\s*/i, "").trim();
}

/** Job title, place, and the description block of a Karirhub posting. */
function karirhubPosting(html: string): string | null {
  const text = htmlToText(html);
  const start = text.indexOf("Bidang pekerjaan");
  if (start < 0) return null;
  const title = html.match(/<title>[^<]*Karirhub - ([^<]+)<\/title>/)?.[1]?.trim() ?? "";
  const end = text.search(/\n(Lamar Sekarang|Lowongan Serupa|Lowongan lainnya|Tentang Perusahaan)\b/);
  const body = text.slice(start, end > start ? end : undefined).trim();
  return [decode(title), body].filter(Boolean).join("\n\n");
}

/** Main content between a page's own heading and its footer, for simple career pages. */
function mainContent(html: string, from: RegExp, to: RegExp): string | null {
  const text = htmlToText(html);
  const start = text.search(from);
  if (start < 0) return null;
  const rest = text.slice(start);
  const end = rest.search(to);
  return (end > 0 ? rest.slice(0, end) : rest).trim() || null;
}

/** Roti'O detail page: the job title line before "Department:" through the "Apply Now" button. */
function rotioPosting(html: string): string | null {
  const text = htmlToText(html);
  const department = text.indexOf("Department:");
  if (department < 0) return null;
  const start = text.lastIndexOf("\n", department - 2) + 1;
  const end = text.indexOf("Apply Now", department);
  return text.slice(start, end > 0 ? end : undefined).replace(/📩\s*$/, "").trim();
}

type Extractor = (html: string) => string | null;

function extractorFor(url: string): Extractor | null {
  if (/turnbackhoax\.id/.test(url)) return turnbackhoaxNarasi;
  if (/karirhub\.kemnaker\.go\.id\/lowongan/.test(url)) return karirhubPosting;
  if (/rotio\.id\/Career\/detail/.test(url)) return rotioPosting;
  if (/richeesefactory\.com\/careers\/\d+/.test(url)) return (h) => mainContent(h, /\nSeluruh Outlet|\nLocal Sales|\nCrew Outlet/, /\n(Apply|Lamar|Kirim Lamaran|©|Copyright)/i);
  if (/siskop2mi\.bp2mi\.go\.id\/lowongan\/detail/.test(url)) return (h) => mainContent(h, /\nDetail Lowongan/, /\n(Lamar|Daftar Sekarang|Bagikan|Lowongan Lainnya)/);
  return null;
}

function screenshot(url: string, file: string): void {
  execFileSync(EDGE, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=900,1700",
    "--virtual-time-budget=10000", `--screenshot=${file}`, url,
  ], { stdio: "ignore", timeout: 60000 });
}

const quote = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

async function main() {
  const [header, ...rows] = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const col = (name: string) => header.indexOf(name);
  const [ID, SPLIT, INPUT, TEXT, IMAGE, SOURCE, NOTE] = ["id", "split", "input_type", "text", "image_file", "sumber_label", "catatan"].map(col);
  const manual: string[] = [];

  for (const row of rows) {
    const id = row[ID];
    if (onlyIds && !onlyIds.has(id)) continue;
    if (row[SPLIT] === "injeksi") continue;
    const source = row[SOURCE];
    // --refill redoes text this script filled earlier; hand-written text is never touched.
    const refill = args.includes("--refill") && row[NOTE].includes(AUTO_NOTE);
    const needsText = (!row[TEXT] || refill) && row[INPUT] !== "gambar";
    const imageFile = row[IMAGE];
    const needsImage = row[INPUT] !== "teks" && imageFile && !imageFile.includes(";") && !existsSync(join(IMAGES_DIR, imageFile));

    if (needsText) {
      const extract = source ? extractorFor(source) : null;
      let text: string | null = null;
      let error = "";
      if (extract) {
        try {
          text = extract(await fetchHtml(source));
        } catch (e) {
          error = (e as Error).message;
        }
      }
      if (text && text.length >= 40) {
        // Site chrome inside the extract means a section boundary was missed.
        const chrome = text.match(/Hak Cipta|©|Kementerian Ketenagakerjaan RI|Pengecekan Status PMI|Info Penyelenggara|Artikel terbaru|Kebijakan Privasi/)?.[0];
        console.log(`teks   ${id}: ${text.length} karakter${chrome ? ` (PERIKSA: ada "${chrome}")` : ""}`);
        if (!dryRun) {
          row[TEXT] = text;
          if (!row[NOTE].includes(AUTO_NOTE)) row[NOTE] = [row[NOTE], AUTO_NOTE].filter(Boolean).join(" ");
        }
      } else {
        manual.push(`${id} teks (${extract ? error || "tidak terbaca" : "sumber perlu disalin manual"})`);
      }
    }

    // Screenshots only for official posting pages; scam images come from archives and are saved by hand.
    if (needsImage && /karirhub|rotio\.id|richeesefactory|siskop2mi/.test(source)) {
      const png = imageFile.replace(/\.\w+$/, ".png");
      if (dryRun) {
        console.log(`gambar ${id}: akan diambil dari ${new URL(source).host}`);
      } else {
        try {
          screenshot(source, join(IMAGES_DIR, png));
          row[IMAGE] = png;
          row[NOTE] = [row[NOTE], AUTO_IMAGE_NOTE].filter(Boolean).join(" ");
          console.log(`gambar ${id}: ${png}`);
        } catch (e) {
          manual.push(`${id} gambar (${(e as Error).message})`);
        }
      }
    } else if (needsImage) {
      manual.push(`${id} gambar (simpan manual: ${imageFile})`);
    }
  }

  if (!dryRun) {
    writeFileSync(CSV_PATH, [header, ...rows].map((cells) => cells.map(quote).join(",")).join("\n") + "\n");
  }
  console.log(`\nPerlu dikerjakan manual (${manual.length}):\n` + manual.map((item) => `- ${item}`).join("\n"));
}

main();
