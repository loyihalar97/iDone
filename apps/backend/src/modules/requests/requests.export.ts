import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Priority, PRIORITY_LABELS_UZ, RequestStatus, STATUS_LABELS_UZ } from "@app/shared-types";

/**
 * Zayavkalar tarixini PDF va XLSX formatlarga eksport qilish yordamchilari.
 * Yaratilgan fayl foydalanuvchining Telegram bot chatiga hujjat sifatida
 * yuboriladi (Mini App ichida to'g'ridan-to'g'ri yuklab olish noqulay).
 */

export interface ExportRow {
  createdAt: Date;
  closedAt: Date | null;
  branchName: string;
  categoryLabel: string;
  description: string;
  priority: string;
  status: string;
  createdByName: string;
  chiefTechnicianName: string | null;
  technicianName: string | null;
  expenseAmount: number | null;
}

const COLUMNS = [
  { header: "№", width: 5 },
  { header: "Ochilgan sana", width: 16 },
  { header: "Filial", width: 20 },
  { header: "Kategoriya", width: 18 },
  { header: "Tavsif", width: 40 },
  { header: "Muhimlik", width: 11 },
  { header: "Holat", width: 18 },
  { header: "Direktor", width: 20 },
  { header: "Bosh texnik", width: 20 },
  { header: "Texnik", width: 20 },
  { header: "Harajat (so'm)", width: 14 },
  { header: "Yopilgan sana", width: 16 },
];

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
}

function rowToCells(row: ExportRow, index: number): (string | number)[] {
  return [
    index + 1,
    formatDate(row.createdAt),
    row.branchName,
    row.categoryLabel,
    row.description,
    PRIORITY_LABELS_UZ[row.priority as Priority] ?? row.priority,
    STATUS_LABELS_UZ[row.status as RequestStatus] ?? row.status,
    row.createdByName,
    row.chiefTechnicianName ?? "—",
    row.technicianName ?? "—",
    row.expenseAmount ?? "—",
    formatDate(row.closedAt),
  ];
}

export async function buildXlsx(rows: ExportRow[], title: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Zayavkalar tarixi");

  sheet.columns = COLUMNS.map((c) => ({ header: c.header, width: c.width }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF7" } };
    cell.border = { bottom: { style: "thin" } };
  });

  rows.forEach((row, i) => {
    const r = sheet.addRow(rowToCells(row, i));
    r.alignment = { vertical: "top", wrapText: true };
    const expenseCell = r.getCell(11);
    if (typeof expenseCell.value === "number") {
      expenseCell.numFmt = "#,##0";
    }
  });

  // Umumiy harajat qatori
  const total = rows.reduce((sum, r) => sum + (r.expenseAmount ?? 0), 0);
  const totalRow = sheet.addRow(["", "", "", "", "", "", "", "", "", "Jami harajat:", total, ""]);
  totalRow.font = { bold: true };
  totalRow.getCell(11).numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

function resolveFont(name: string): string | null {
  // dist/modules/requests -> dist/assets/fonts (yoki src rejimida src/assets/fonts)
  const p = path.join(__dirname, "..", "..", "assets", "fonts", name);
  return fs.existsSync(p) ? p : null;
}

export function buildPdf(rows: ExportRow[], title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 24 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Kirill va o'zbekcha belgilarni to'g'ri chiqarish uchun DejaVu Sans.
    const regular = resolveFont("DejaVuSans.ttf");
    const bold = resolveFont("DejaVuSans-Bold.ttf");
    const FONT = regular ?? "Helvetica";
    const FONT_BOLD = bold ?? "Helvetica-Bold";
    if (regular) doc.registerFont("body", regular);
    if (bold) doc.registerFont("bold", bold);
    const bodyFont = regular ? "body" : FONT;
    const boldFont = bold ? "bold" : FONT_BOLD;

    const pageWidth = doc.page.width - 48;
    // PDFda ustunlarni birlashtirilgan holda beramiz (kengroq o'qish uchun)
    const cols = [
      { key: "n", label: "№", w: 0.035 },
      { key: "date", label: "Sana", w: 0.1 },
      { key: "branch", label: "Filial", w: 0.11 },
      { key: "category", label: "Kategoriya", w: 0.1 },
      { key: "desc", label: "Tavsif", w: 0.24 },
      { key: "status", label: "Holat", w: 0.1 },
      { key: "people", label: "Mas'ullar", w: 0.16 },
      { key: "expense", label: "Harajat", w: 0.075 },
      { key: "closed", label: "Yopilgan", w: 0.1 },
    ];

    doc.font(boldFont).fontSize(14).text(title, { align: "left" });
    doc
      .font(bodyFont)
      .fontSize(8.5)
      .fillColor("#666666")
      .text(`Eksport sanasi: ${formatDate(new Date())} · Jami: ${rows.length} ta zayavka`);
    doc.moveDown(0.8);

    const drawHeader = () => {
      const y = doc.y;
      let x = 24;
      doc.font(boldFont).fontSize(8).fillColor("#000000");
      for (const col of cols) {
        doc.text(col.label, x, y, { width: pageWidth * col.w - 6 });
        x += pageWidth * col.w;
      }
      doc
        .moveTo(24, doc.y + 3)
        .lineTo(24 + pageWidth, doc.y + 3)
        .strokeColor("#999999")
        .lineWidth(0.5)
        .stroke();
      doc.y += 7;
    };

    drawHeader();

    rows.forEach((row, i) => {
      const cells: Record<string, string> = {
        n: String(i + 1),
        date: formatDate(row.createdAt),
        branch: row.branchName,
        category: row.categoryLabel,
        desc: row.description.length > 220 ? row.description.slice(0, 220) + "…" : row.description,
        status: STATUS_LABELS_UZ[row.status as RequestStatus] ?? row.status,
        people: [
          row.createdByName ? `D: ${row.createdByName}` : null,
          row.chiefTechnicianName ? `BT: ${row.chiefTechnicianName}` : null,
          row.technicianName ? `T: ${row.technicianName}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        expense: row.expenseAmount !== null ? row.expenseAmount.toLocaleString("uz-UZ") : "—",
        closed: formatDate(row.closedAt),
      };

      doc.font(bodyFont).fontSize(7.5).fillColor("#000000");

      // Qator balandligini hisoblash
      let maxHeight = 0;
      let x = 24;
      for (const col of cols) {
        const h = doc.heightOfString(cells[col.key], { width: pageWidth * col.w - 6 });
        if (h > maxHeight) maxHeight = h;
      }

      if (doc.y + maxHeight > doc.page.height - 30) {
        doc.addPage();
        doc.y = 24;
        drawHeader();
        doc.font(bodyFont).fontSize(7.5).fillColor("#000000");
      }

      const y = doc.y;
      x = 24;
      for (const col of cols) {
        doc.text(cells[col.key], x, y, { width: pageWidth * col.w - 6 });
        x += pageWidth * col.w;
      }
      doc.y = y + maxHeight + 4;
      doc
        .moveTo(24, doc.y - 2)
        .lineTo(24 + pageWidth, doc.y - 2)
        .strokeColor("#DDDDDD")
        .lineWidth(0.4)
        .stroke();
    });

    const total = rows.reduce((sum, r) => sum + (r.expenseAmount ?? 0), 0);
    doc.moveDown(0.6);
    doc
      .font(boldFont)
      .fontSize(9)
      .text(`Jami harajat: ${total.toLocaleString("uz-UZ")} so'm`, 24, doc.y);

    doc.end();
  });
}
