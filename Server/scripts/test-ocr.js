const fs = require('fs');
const path = require('path');
const { extractMarksFromBuffer } = require('../src/Utils/ocrAnswerSheet');

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node test-ocr.js <path-to-pdf-or-image> [subject1,subject2,...]');
    process.exit(1);
  }
  const subjects = (process.argv[3] || 'Physics,Chemistry,Mathematics').split(',');
  const buf = fs.readFileSync(path.resolve(file));
  try {
    const res = await extractMarksFromBuffer(buf, subjects);
    console.log('Extraction result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error during extraction:', err);
  }
}

run();
