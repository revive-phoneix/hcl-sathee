// OCR is best-effort: it pre-fills marks for the Mitra to review and correct.
// It never saves anything on its own — saveTestMarks always uses the
// Mitra-confirmed values, not the raw OCR output.
let visionClient = null;

const getVisionClient = () => {
  if (visionClient) return visionClient;
  try {
    const vision = require("@google-cloud/vision"); // npm i @google-cloud/vision
    visionClient = new vision.ImageAnnotatorClient();
    return visionClient;
  } catch (err) {
    console.warn("OCR unavailable (@google-cloud/vision not installed/configured):", err.message);
    return null;
  }
};

// Matches lines like "Physics: 34/50", "Chemistry - 41 / 50", "Maths 76/100"
const MARK_LINE_REGEX = /([A-Za-z][A-Za-z .&]{2,30})[:\-]?\s*(\d{1,3})\s*\/\s*(\d{1,3})/g;

const extractMarksFromBuffer = async (buffer) => {
  const client = getVisionClient();
  if (!client) return { text: "", marks: [], available: false };

  const [result] = await client.documentTextDetection({ image: { content: buffer } });
  const text = result.fullTextAnnotation?.text || "";

  const marks = [...text.matchAll(MARK_LINE_REGEX)].map(([, subject, obtained, total]) => ({
    subject: subject.trim(),
    marksObtained: Number(obtained),
    totalMarks: Number(total),
    confidence: "low", // always surfaced as low — Mitra must confirm before saving
  }));

  return { text, marks, available: true };
};

module.exports = { extractMarksFromBuffer };