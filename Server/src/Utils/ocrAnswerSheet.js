const { extractSectionMarks } = require("./sectionMarksParser");

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

const isPDF = (buf) => {
  try {
    return buf.slice(0, 4).toString() === "%PDF";
  } catch {
    return false;
  }
};

const extractMarksFromBuffer = async (buffer, subjects = []) => {
  let text = "";

  // Text-based PDFs: try pdf-parse first, no OCR needed.
  if (isPDF(buffer)) {
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      text = data?.text || "";
    } catch (err) {
      console.warn("pdf-parse not available or failed, falling back to Vision OCR:", err.message);
    }
  }

  // Scanned/photographed sheets: fall back to Vision OCR.
  if (!text) {
    const client = getVisionClient();
    if (!client) {
      console.warn("No Vision client available and no text extracted. Install @google-cloud/vision or pdf-parse.");
      return { text: "", marks: [], available: false };
    }
    try {
      const [result] = await client.documentTextDetection({ image: { content: buffer } });
      text = result.fullTextAnnotation?.text || "";
    } catch (err) {
      console.error("Vision OCR failed:", err.message);
      return { text: "", marks: [], available: false, error: err.message };
    }
  }

  const marks = extractSectionMarks(text, subjects);
  return { text, marks, available: true };
};

module.exports = { extractMarksFromBuffer };