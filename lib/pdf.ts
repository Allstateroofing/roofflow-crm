"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GOLD: [number, number, number] = [212, 175, 55];
const INK: [number, number, number] = [17, 24, 39];
const GREY: [number, number, number] = [107, 114, 128];

export type Company = {
  company_name?: string | null;
  company_address?: string | null;
  company_phone?: string | null;
  company_email?: string | null;
};

export type DocumentData = {
  kind: "STATEMENT";
  number: string;
  date: string;
  status?: string | null;
  client: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  items: { description: string; quantity: number; price: number }[];
  total: number;
  paid?: number;
  deposit?: number;
  notes?: string | null;
  terms?: string | null;
};

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** Pasqyra e punes qe i jepet klientit: cmimi, sa ka paguar, sa mbetet. */
export function buildDocument(company: Company, doc: DocumentData) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const width = pdf.internal.pageSize.getWidth();
  const M = 48;

  // ---- Koka ----
  pdf.setFillColor(...INK);
  pdf.rect(0, 0, width, 96, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(company.company_name || "All State Roofing", M, 44);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 200);

  const contact = [
    company.company_address,
    company.company_phone,
    company.company_email,
  ]
    .filter(Boolean)
    .join("  ·  ");

  if (contact) pdf.text(contact, M, 62);

  pdf.setTextColor(...GOLD);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.text(doc.kind, width - M, 44, { align: "right" });

  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(doc.number, width - M, 62, { align: "right" });

  // ---- Palet ----
  let y = 136;

  pdf.setTextColor(...GREY);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("BILL TO", M, y);
  pdf.text("DATE", width - M - 140, y);
  if (doc.status) pdf.text("STATUS", width - M, y, { align: "right" });

  y += 16;
  pdf.setTextColor(...INK);
  pdf.setFontSize(11);
  pdf.text(doc.client.name || "—", M, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(doc.date, width - M - 140, y);

  if (doc.status) {
    pdf.text(doc.status.toUpperCase(), width - M, y, { align: "right" });
  }

  y += 15;
  pdf.setFontSize(9);
  pdf.setTextColor(...GREY);

  for (const line of [
    doc.client.address,
    doc.client.phone,
    doc.client.email,
  ].filter(Boolean)) {
    pdf.text(String(line), M, y);
    y += 13;
  }

  // ---- Zerat ----
  autoTable(pdf, {
    startY: y + 18,
    margin: { left: M, right: M },
    head: [["Description", "Qty", "Price", "Amount"]],
    body: doc.items.map((it) => [
      it.description || "—",
      String(it.quantity),
      usd(it.price),
      usd(it.quantity * it.price),
    ]),
    headStyles: {
      fillColor: INK,
      textColor: [255, 255, 255],
      fontSize: 9,
      halign: "left",
    },
    bodyStyles: { fontSize: 9.5, textColor: INK },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    columnStyles: {
      1: { halign: "right", cellWidth: 50 },
      2: { halign: "right", cellWidth: 80 },
      3: { halign: "right", cellWidth: 90 },
    },
  });

  // ---- Totalet ----
  let ty = (pdf as any).lastAutoTable.finalY + 24;
  const labelX = width - M - 150;

  const rows: [string, string, boolean][] = [["Total", usd(doc.total), false]];

  if (doc.deposit != null && doc.deposit > 0) {
    rows.push(["Deposit due", usd(doc.deposit), false]);
    rows.push(["Balance", usd(doc.total - doc.deposit), true]);
  }

  if (doc.paid != null) {
    rows.push(["Amount paid", usd(doc.paid), false]);
    rows.push(["Balance due", usd(doc.total - doc.paid), true]);
  }

  for (const [label, value, strong] of rows) {
    pdf.setFont("helvetica", strong ? "bold" : "normal");
    pdf.setFontSize(strong ? 12 : 10);
    pdf.setTextColor(...(strong ? INK : GREY));
    pdf.text(label, labelX, ty);

    pdf.setTextColor(...INK);
    pdf.text(value, width - M, ty, { align: "right" });
    ty += strong ? 22 : 17;
  }

  // ---- Shenimet ----
  if (doc.notes || doc.terms) {
    ty += 10;
    pdf.setDrawColor(230, 232, 236);
    pdf.line(M, ty, width - M, ty);
    ty += 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...GREY);
    pdf.text("NOTES", M, ty);

    ty += 14;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...INK);

    const text = [doc.notes, doc.terms].filter(Boolean).join("\n");
    pdf.text(pdf.splitTextToSize(text, width - M * 2), M, ty);
  }

  // ---- Fundi ----
  pdf.setFontSize(8);
  pdf.setTextColor(...GREY);
  pdf.text(
    `${company.company_name || "All State Roofing"} — thank you for your business.`,
    width / 2,
    pdf.internal.pageSize.getHeight() - 32,
    { align: "center" }
  );

  return pdf;
}

export function downloadDocument(company: Company, doc: DocumentData) {
  buildDocument(company, doc).save(`${doc.number}.pdf`);
}
