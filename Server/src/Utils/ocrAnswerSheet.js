let visionClient = null;

const getVisionClient = () => {
  if (visionClient) return visionClient;
  try {
    const vision = require("@google-cloud/vision");
    visionClient = new vision.ImageAnnotatorClient();
    return visionClient;
  } catch (err) {
    console.warn("OCR unavailable (@google-cloud/vision not installed/configured):", err.message);
    return null;
  }
};

const findMarksNearSubject = (text, subject) => {
  const idx = text.toLowerCase().indexOf(subject.toLowerCase());
  if (idx === -1) {
    return null;
  }

  const window = text.slice(idx, idx + 4000);

  // Try common patterns: "Total 14 15", "14 / 15", "14 15" (adjacent numbers)
  const patterns = [
    /(?:Subject\s+)?Total[:\s]*?(\d{1,4})\s+(\d{1,4})/i,
    /(\d{1,4})\s*\/\s*(\d{1,4})/,
    /(?:Subject\s+)?Total[:\s]*?(\d{1,4})\s*[:\-]?\s*(\d{1,4})/i,
    /\b(\d{1,4})\s+(\d{1,4})\b/
  ];

  for (const pat of patterns) {
    const m = window.match(pat);
    if (m) {
      return { marksObtained: Number(m[1]), totalMarks: Number(m[2]) };
    }
  }

  return null;
};

const extractMarksFromBuffer = async (buffer, subjects = []) => {
  // Note: don't require Vision client until after attempting pdf-parse fallback.

  // Helper: quick PDF check
  const isPDF = (buf) => {
    try {
      const start = buf.slice(0, 4).toString();
      return start === "%PDF";
    } catch (e) {
      return false;
    }
  };

  let text = "";

  // If it's a PDF, try to extract text using pdf-parse (if installed). This helps for
  // text-based PDFs where OCR isn't necessary. If pdf-parse isn't available, we'll
  // fall back to Google Vision OCR below (may not support PDFs in this path).
  if (isPDF(buffer)) {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      text = data?.text || "";
    } catch (err) {
      console.warn('pdf-parse not available or failed, falling back to Vision OCR:', err.message);
      // leave text empty so Vision OCR is used below
    }
  }

  // If pdf-parse didn't produce text, attempt Vision OCR (if available)
  if (!text) {
    const client = getVisionClient();
    if (!client) {
      console.warn('No Vision client available and PDF text not extracted. Install @google-cloud/vision or pdf-parse.');
      return { text: "", marks: [], available: false };
    }

    try {
      const [result] = await client.documentTextDetection({ image: { content: buffer } });
      text = result.fullTextAnnotation?.text || "";
    } catch (err) {
      console.error('Vision OCR failed:', err.message);
      return { text: "", marks: [], available: false, error: err.message };
    }
  }

  // Diagnostic summary
  try {
    console.info(`OCR text length: ${text.length}`);
  } catch (e) {}

  const marks = [];
  for (const subject of subjects) {
    const found = findMarksNearSubject(text, subject);
    if (found) {
      marks.push({ subject, ...found, confidence: "low" });
    } else {
      // add a short diagnostic snippet to help debugging when no match found
      const lowIdx = text.toLowerCase().indexOf(subject.toLowerCase());
      if (lowIdx !== -1) {
        const snippet = text.slice(lowIdx, Math.min(text.length, lowIdx + 300)).replace(/\n/g, ' ');
        console.debug(`No marks regex-match for subject '${subject}', text snippet: ${snippet}`);
      } else {
        console.debug(`Subject '${subject}' not found in OCR text.`);
      }
    }
  }

  return { text, marks, available: true };
};

module.exports = { extractMarksFromBuffer };