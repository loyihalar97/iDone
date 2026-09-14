import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import {
  Language,
  Priority,
  priorityLabel,
  RequestStatus,
  Role,
  roleLabel,
  statusLabel,
} from "@app/shared-types";
import { DEFAULT_LANGUAGE, formatDateTime, formatNumber } from "../../core/i18n";
import { t } from "../../core/i18n/messages";

/**
 * Zayavkalar tarixini PDF va XLSX formatlarga eksport qilish yordamchilari.
 * Yaratilgan fayl foydalanuvchining Telegram bot chatiga hujjat sifatida
 * yuboriladi (Mini App ichida to'g'ridan-to'g'ri yuklab olish noqulay).
 *
 * BARCHA matnlar (ustun sarlavhalari, holat/muhimlik/lavozim nomlari, sana
 * formati, "Jami harajat" qatori) hisobotni oladigan foydalanuvchining
 * tilida chiqadi.
 */

export interface ExportRow {
  createdAt: Date;
  closedAt: Date | null;
  branchName: string;
  /** Kategoriya nomi — allaqachon kerakli tilda tayyorlangan. */
  categoryLabel: string;
  description: string;
  priority: string;
  status: string;
  createdByName: string;
  /** Zayavkani ochgan xodimning lavozimi (kalit — tarjima shu yerda qilinadi). */
  createdByRole: string;
  chiefTechnicianName: string | null;
  technicianName: string | null;
  expenseAmount: number | null;
  /** Oxirgi izoh (masalan bosh texnikning "bajarish imkonsiz" sababi). */
  comment: string | null;
}

/** XLSX ustunlari (kengliklari bilan) — nomlari tanlangan tildan olinadi. */
function xlsxColumns(lang: Language) {
  const c = t(lang).export.columns;
  return [
    { header: c.index, width: 5 },
    { header: c.createdAt, width: 16 },
    { header: c.branch, width: 20 },
    { header: c.category, width: 18 },
    { header: c.description, width: 40 },
    { header: c.priority, width: 11 },
    { header: c.status, width: 18 },
    { header: c.createdBy, width: 20 },
    { header: c.createdByRole, width: 18 },
    { header: c.chiefTechnician, width: 20 },
    { header: c.technician, width: 20 },
    { header: c.expense, width: 15 },
    { header: c.comment, width: 32 },
    { header: c.closedAt, width: 16 },
  ];
}

/** XLSX'dagi "Harajat" ustunining tartib raqami (1-based). */
const EXPENSE_COL = 12;

function rowToCells(row: ExportRow, index: number, lang: Language): (string | number)[] {
  return [
    index + 1,
    formatDateTime(row.createdAt, lang),
    row.branchName,
    row.categoryLabel,
    row.description,
    priorityLabel(row.priority as Priority, lang),
    statusLabel(row.status as RequestStatus, lang),
    row.createdByName,
    roleLabel(row.createdByRole as Role, lang),
    row.chiefTechnicianName ?? "—",
    row.technicianName ?? "—",
    row.expenseAmount ?? "—",
    row.comment ?? "—",
    formatDateTime(row.closedAt, lang),
  ];
}

export async function buildXlsx(
  rows: ExportRow[],
  lang: Language = DEFAULT_LANGUAGE
): Promise<Buffer> {
  const messages = t(lang);
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(messages.export.sheetName);

  sheet.columns = xlsxColumns(lang).map((c) => ({ header: c.header, width: c.width }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF7" } };
    cell.border = { bottom: { style: "thin" } };
  });

  rows.forEach((row, i) => {
    const r = sheet.addRow(rowToCells(row, i, lang));
    r.alignment = { vertical: "top", wrapText: true };
    const expenseCell = r.getCell(EXPENSE_COL);
    if (typeof expenseCell.value === "number") {
      expenseCell.numFmt = "#,##0";
    }
  });

  // Umumiy harajat qatori
  const total = rows.reduce((sum, r) => sum + (r.expenseAmount ?? 0), 0);
  const totalCells: (string | number)[] = xlsxColumns(lang).map(() => "");
  totalCells[EXPENSE_COL - 2] = messages.export.totalExpenseLabel;
  totalCells[EXPENSE_COL - 1] = total;
  const totalRow = sheet.addRow(totalCells);
  totalRow.font = { bold: true };
  totalRow.getCell(EXPENSE_COL).numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

function resolveFont(name: string): string | null {
  // dist/modules/requests -> dist/assets/fonts (yoki src rejimida src/assets/fonts)
  const p = path.join(__dirname, "..", "..", "assets", "fonts", name);
  return fs.existsSync(p) ? p : null;
}

export function buildPdf(
  rows: ExportRow[],
  title: string,
  lang: Language = DEFAULT_LANGUAGE,
  subtitle?: string
): Promise<Buffer> {
  const messages = t(lang);

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
    const pdfCols = messages.export.pdfColumns;
    const cols = [
      { key: "n", label: pdfCols.index, w: 0.03 },
      { key: "date", label: pdfCols.date, w: 0.09 },
      { key: "branch", label: pdfCols.branch, w: 0.1 },
      { key: "category", label: pdfCols.category, w: 0.09 },
      { key: "desc", label: pdfCols.description, w: 0.19 },
      { key: "status", label: pdfCols.status, w: 0.09 },
      { key: "people", label: pdfCols.people, w: 0.155 },
      { key: "expense", label: pdfCols.expense, w: 0.07 },
      { key: "comment", label: pdfCols.comment, w: 0.11 },
      { key: "closed", label: pdfCols.closedAt, w: 0.075 },
    ];

    doc.font(boldFont).fontSize(14).text(title, { align: "left" });
    if (subtitle) {
      doc.font(boldFont).fontSize(9.5).fillColor("#333333").text(subtitle);
    }
    doc
      .font(bodyFont)
      .fontSize(8.5)
      .fillColor("#666666")
      .text(messages.export.meta(formatDateTime(new Date(), lang), rows.length));
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
        date: formatDateTime(row.createdAt, lang),
        branch: row.branchName,
        category: row.categoryLabel,
        desc: row.description.length > 220 ? row.description.slice(0, 220) + "…" : row.description,
        status: statusLabel(row.status as RequestStatus, lang),
        people: [
          row.createdByName
            ? `${roleLabel(row.createdByRole as Role, lang)}: ${row.createdByName}`
            : null,
          row.chiefTechnicianName
            ? `${messages.export.chiefShort}: ${row.chiefTechnicianName}`
            : null,
          row.technicianName
            ? `${messages.export.technicianShort}: ${row.technicianName}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        expense:
          row.expenseAmount !== null && row.expenseAmount !== undefined
            ? formatNumber(row.expenseAmount, lang)
            : "—",
        comment: row.comment
          ? row.comment.length > 160
            ? row.comment.slice(0, 160) + "…"
            : row.comment
          : "—",
        closed: formatDateTime(row.closedAt, lang),
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
      .text(messages.export.totalExpenseLine(formatNumber(total, lang)), 24, doc.y);

    doc.end();
  });
}
