import * as XLSX from "xlsx";

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const safeFilename = (name) =>
  (name || "export")
    .toString()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "export";

/**
 * @param {{ headers: string[], rows: (string|number)[][], filename: string, sheetName?: string }} options
 */
export const downloadTableXlsx = ({ headers, rows, filename, sheetName = "Sheet1" }) => {
  const data = [headers, ...(rows.length ? rows : [headers.map(() => "—")])];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${safeFilename(filename)}.xlsx`);
};

/**
 * @param {{ title?: string, headers: string[], rows: (string|number)[][], filename: string }} options
 */
export const downloadTableSvg = ({ title = "Export", headers, rows, filename }) => {
  const colCount = Math.max(headers.length, 1);
  const colWidth = 160;
  const rowHeight = 36;
  const headerHeight = 44;
  const paddingX = 24;
  const paddingY = 24;
  const titleHeight = 40;
  const tableWidth = colWidth * colCount;
  const bodyRows = rows.length ? rows : [headers.map(() => "No records")];
  const tableHeight = headerHeight + bodyRows.length * rowHeight;
  const width = tableWidth + paddingX * 2;
  const height = titleHeight + tableHeight + paddingY * 2;

  const headerCells = headers
    .map((header, i) => {
      const x = paddingX + i * colWidth;
      return `
      <rect x="${x}" y="${paddingY + titleHeight}" width="${colWidth}" height="${headerHeight}" fill="#3B82F6"/>
      <text x="${x + colWidth / 2}" y="${paddingY + titleHeight + headerHeight / 2 + 5}" text-anchor="middle" fill="#ffffff" font-size="13" font-family="Arial, sans-serif" font-weight="700">${escapeXml(header)}</text>`;
    })
    .join("");

  const bodyCells = bodyRows
    .map((row, rowIndex) => {
      const y = paddingY + titleHeight + headerHeight + rowIndex * rowHeight;
      const fill = rowIndex % 2 === 0 ? "#ffffff" : "#F8FAFC";
      return row
        .map((cell, colIndex) => {
          const x = paddingX + colIndex * colWidth;
          return `
      <rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" fill="${fill}" stroke="#E2E8F0"/>
      <text x="${x + 12}" y="${y + rowHeight / 2 + 5}" fill="#1E293B" font-size="12" font-family="Arial, sans-serif">${escapeXml(cell)}</text>`;
        })
        .join("");
    })
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#F1F5F9"/>
  <text x="${paddingX}" y="${paddingY + 20}" fill="#0F172A" font-size="18" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title)}</text>
  ${headerCells}
  ${bodyCells}
</svg>`;

  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${safeFilename(filename)}.svg`);
};
