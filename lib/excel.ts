"use client";

import * as XLSX from "xlsx";

/**
 * Shkarkon nje fletë Excel nga rreshtat e dhene (SPEC §21).
 * Kolonat vijne nga celesat e objektit te pare, ne rradhen e shkruar.
 */
export function exportToExcel(
  rows: Record<string, unknown>[],
  fileName: string,
  sheetName = "Sheet1"
) {
  if (rows.length === 0) return false;

  const sheet = XLSX.utils.json_to_sheet(rows);

  // Gjeresi kolonash sipas permbajtjes, qe te mos dalin te ngjeshura.
  const keys = Object.keys(rows[0]);
  sheet["!cols"] = keys.map((k) => ({
    wch: Math.min(
      40,
      Math.max(
        k.length + 2,
        ...rows.map((r) => String(r[k] ?? "").length + 2)
      )
    ),
  }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, sheetName);

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `${fileName}-${stamp}.xlsx`);

  return true;
}

/** Disa flete ne nje skedar te vetem. */
export function exportSheets(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
  fileName: string
) {
  const book = XLSX.utils.book_new();
  let any = false;

  for (const s of sheets) {
    if (s.rows.length === 0) continue;
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(s.rows),
      s.name
    );
    any = true;
  }

  if (!any) return false;

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `${fileName}-${stamp}.xlsx`);

  return true;
}
