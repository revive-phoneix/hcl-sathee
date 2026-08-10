const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

// Same pattern used for OCR text — "Physics: 34/50", "Chemistry - 41 / 50", etc.
const MARK_LINE_REGEX = /([A-Za-z][A-Za-z .&]{2,30})[:\-]?\s*(\d{1,3})\s*\/\s*(\d{1,3})/g;

const extractTextFromDocument = async (buffer, mimetype) => {
  if (mimetype === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text || "";
  }
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
  throw new Error("Unsupported file type for text extraction");
};

const extractMarksFromDocument = async (buffer, mimetype) => {
  const text = await extractTextFromDocument(buffer, mimetype);

  const marks = [...text.matchAll(MARK_LINE_REGEX)].map(([, subject, obtained, total]) => ({
    subject: subject.trim(),
    marksObtained: Number(obtained),
    totalMarks: Number(total),
    confidence: "high", // came from real embedded text, not OCR guesswork
  }));

  return { text, marks, available: true };
};

module.exports = { extractMarksFromDocument };
