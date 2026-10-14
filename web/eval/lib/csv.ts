/**
 * Minimal RFC 4180 CSV parser: quoted fields, doubled quotes, and line breaks inside quotes
 * (posting text spans several lines). Handles the BOM that Excel adds and CRLF line endings.
 */
export function parseCsv(content: string): string[][] {
  const text = content.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  // Blank lines (often trailing) are not records.
  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

/** Rows as objects keyed by the header row. Missing trailing cells become "". */
export function parseCsvRecords(content: string): { header: string[]; records: Array<Record<string, string>> } {
  const [header = [], ...rows] = parseCsv(content);
  const names = header.map((name) => name.trim());
  const records = rows.map((cells) =>
    Object.fromEntries(names.map((name, index) => [name, (cells[index] ?? "").trim()]))
  );
  return { header: names, records };
}
