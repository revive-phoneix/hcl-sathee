const SUBJECT_ALIASES = {
  physics: ["physics"],
  chemistry: ["chemistry"],
  mathematics: ["mathematics", "maths", "math"],
  biology: ["biology"],
  english: ["english"],
  reasoning: ["reasoning", "logical reasoning"],
  gk: ["general knowledge", "gk"],
};

const normalize = (s) => String(s || "").trim().toLowerCase();

const aliasesFor = (subject) => {
  const key = normalize(subject);
  for (const aliases of Object.values(SUBJECT_ALIASES)) {
    if (aliases.includes(key)) return aliases;
  }
  return [key];
};

// Splits the document on ALL-CAPS header lines only ("PHYSICS", "CHEMISTRY", ...).
// The mixed-case subtitle line ("Physics • Chemistry • Mathematics") does NOT
// match this pattern, so it can no longer be mistaken for a section start.
const splitIntoSections = (text) => {
  const headerRegex = /^[ \t]*([A-Z][A-Z .&]{2,30})[ \t]*$/gm;
  const headers = [];
  let m;
  while ((m = headerRegex.exec(text)) !== null) {
    headers.push({ name: m[1].trim(), start: m.index, end: m.index + m[0].length });
  }
  return headers.map((h, i) => ({
    name: h.name,
    body: text.slice(h.end, headers[i + 1]?.start ?? text.length),
  }));
};

const findTotalInSection = (body) => {
  const totalMatch = body.match(/(?:Subject\s+)?Total[:\s]+(\d{1,4})\s+(\d{1,4})/i);
  if (totalMatch) return { marksObtained: Number(totalMatch[1]), totalMarks: Number(totalMatch[2]) };
  const slashMatch = body.match(/(\d{1,4})\s*\/\s*(\d{1,4})/);
  if (slashMatch) return { marksObtained: Number(slashMatch[1]), totalMarks: Number(slashMatch[2]) };
  return null;
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractSectionMarks = (text, subjects = []) => {
  const sections = splitIntoSections(text);
  const marks = [];

  for (const subject of subjects) {
    const aliases = aliasesFor(subject);

    // Prefer explicit ALL-CAPS sections when available
    const section = sections.find((s) => aliases.includes(normalize(s.name)));
    if (section) {
      const found = findTotalInSection(section.body);
      if (found) {
        marks.push({ subject, ...found, confidence: "high" });
        continue;
      }
    }

    // Fallback: search the whole text for any alias occurrence and inspect a nearby window
    let foundFallback = null;
    for (const alias of aliases) {
      const re = new RegExp("\\b" + escapeRegex(alias) + "\\b", "gi");
      let m;
      while ((m = re.exec(text)) !== null) {
        const idx = m.index;
        const window = text.slice(Math.max(0, idx - 300), Math.min(text.length, idx + 300));
        const found = findTotalInSection(window);
        if (found) {
          foundFallback = found;
          break;
        }
      }
      if (foundFallback) break;
    }

    if (foundFallback) marks.push({ subject, ...foundFallback, confidence: "low" });
  }

  return marks;
};

module.exports = { extractSectionMarks };