const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { extractSectionMarks } = require("./sectionMarksParser");

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

const extractMarksFromDocument = async (buffer, mimetype, subjects = []) => {
  const text = await extractTextFromDocument(buffer, mimetype);
  const marks = extractSectionMarks(text, subjects);
  return { text, marks, available: true };
};

module.exports = { extractMarksFromDocument };