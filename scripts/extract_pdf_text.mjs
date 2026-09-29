import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

const file = process.argv[2];
if (!file) {
    console.error('Usage: node extract_pdf_text.mjs <file.pdf>');
    process.exit(1);
}
const buf = fs.readFileSync(path.resolve(file));
const parser = new PDFParse({ data: buf });
const result = await parser.getText();
console.log(result.text);
