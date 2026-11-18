import { inflateRawSync } from "node:zlib";

export class DocxExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocxExtractionError";
  }
}

type ZipEntry = { name: string; compression: number; compressedSize: number; localHeaderOffset: number };

function readZipEntries(buffer: Buffer): ZipEntry[] {
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65_557); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) throw new DocxExtractionError("The selected DOCX file is not a valid Word document.");
  const count = buffer.readUInt16LE(eocd + 10); const offset = buffer.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = []; let cursor = offset;
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) throw new DocxExtractionError("The selected DOCX file has an unsupported archive structure.");
    const nameLength = buffer.readUInt16LE(cursor + 28); const extraLength = buffer.readUInt16LE(cursor + 30); const commentLength = buffer.readUInt16LE(cursor + 32);
    entries.push({ name: buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8"), compression: buffer.readUInt16LE(cursor + 10), compressedSize: buffer.readUInt32LE(cursor + 20), localHeaderOffset: buffer.readUInt32LE(cursor + 42) });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function entryContents(buffer: Buffer, entry: ZipEntry) {
  const offset = entry.localHeaderOffset;
  if (offset + 30 > buffer.length || buffer.readUInt32LE(offset) !== 0x04034b50) throw new DocxExtractionError("The selected DOCX file has an unsupported document entry.");
  const nameLength = buffer.readUInt16LE(offset + 26); const extraLength = buffer.readUInt16LE(offset + 28); const data = buffer.subarray(offset + 30 + nameLength + extraLength, offset + 30 + nameLength + extraLength + entry.compressedSize);
  if (entry.compression === 0) return data;
  if (entry.compression === 8) return inflateRawSync(data);
  throw new DocxExtractionError("The selected DOCX uses an unsupported compression format.");
}

function decodeWordText(value: string) {
  return value.replace(/<w:tab\b[^>]*\/>/gi, "\t").replace(/<w:br\b[^>]*\/>/gi, "\n").replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gi, (_match, text) => text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** Extracts only local Word text/table content. It never executes macros or resolves external links. */
export function extractDocxText(buffer: Buffer) {
  const entries = readZipEntries(buffer);
  if (entries.some((entry) => /(^|\/)vbaProject\.bin$/i.test(entry.name))) throw new DocxExtractionError("Macro-enabled Word content is not accepted.");
  const document = entries.find((entry) => entry.name === "word/document.xml");
  if (!document) throw new DocxExtractionError("The selected DOCX file has no readable document content.");
  const xml = entryContents(buffer, document).toString("utf8");
  const tableRows: string[] = [];
  for (const row of xml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/gi)) {
    const cells = [...row[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/gi)].map((cell) => decodeWordText(cell[0])).filter(Boolean);
    if (cells.length >= 2) tableRows.push(`${cells[0]}: ${cells.slice(1).join(" | ")}`);
  }
  // Table cells are emitted below as labelled key/value rows.  Excluding tables
  // here avoids a second, unlabelled copy of the same text confusing the
  // conservative profile parser.
  const xmlWithoutTables = xml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/gi, "");
  const paragraphs = [...xmlWithoutTables.matchAll(/<w:p\b[\s\S]*?<\/w:p>/gi)].map((paragraph) => decodeWordText(paragraph[0])).filter(Boolean);
  const text = [...paragraphs, ...tableRows].join("\n").slice(0, 30_000);
  return { text, embeddedImageCount: entries.filter((entry) => entry.name.startsWith("word/media/")).length };
}
