const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

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

// Looks for two numbers shortly after a subject's name — either
// "Subject Total 14 15" style, or "Physics: 34/50" style.
const findMarksNearSubject = (text, subject) => {
  const idx = text.toLowerCase().indexOf(subject.toLowerCase());
  if (idx === -1) return null;

  const window = text.slice(idx, idx + 4000);

  const totalMatch = window.match(/Total\s+(\d{1,4})\s+(\d{1,4})/i);
  if (totalMatch) {
    return { marksObtained: Number(totalMatch[1]), totalMarks: Number(totalMatch[2]) };
  }

  const slashMatch = window.match(/(\d{1,4})\s*\/\s*(\d{1,4})/);
  if (slashMatch) {
    return { marksObtained: Number(slashMatch[1]), totalMarks: Number(slashMatch[2]) };
  }

  return null;
};

const extractMarksFromDocument = async (buffer, mimetype, subjects = []) => {
  const text = await extractTextFromDocument(buffer, mimetype);

  const marks = [];
  for (const subject of subjects) {
    const found = findMarksNearSubject(text, subject);
    if (found) {
      marks.push({ subject, ...found, confidence: "high" });
    }
  }

  return { text, marks, available: true };
};

module.exports = { extractMarksFromDocument };