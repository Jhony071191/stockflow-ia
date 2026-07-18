import type { UniversalSheetInput } from "./universal-import";

export type SupportedDocumentFormat = "xlsx" | "csv" | "tsv" | "json" | "pdf" | "docx" | "txt";

export type ExtractedBusinessDocument = {
  format: SupportedDocumentFormat;
  formatLabel: string;
  sheets: UniversalSheetInput[];
  warnings: string[];
};

type PdfTextItem = {
  str: string;
  width?: number;
  transform?: number[];
};

const FORMAT_LABELS: Record<SupportedDocumentFormat, string> = {
  xlsx: "Excel",
  csv: "CSV",
  tsv: "TSV",
  json: "JSON",
  pdf: "PDF con texto",
  docx: "Word",
  txt: "Texto / reporte",
};

const cleanRows = (rows: unknown[][]) => rows
  .map((row) => row.map((cell) => typeof cell === "string" ? cell.trim() : cell))
  .filter((row) => row.some((cell) => String(cell ?? "").trim()));

const uniqueSheetName = (name: string, used: Set<string>) => {
  const base = name.trim().slice(0, 31) || "Datos";
  let candidate = base;
  let counter = 2;
  while (used.has(candidate)) {
    const suffix = ` ${counter}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    counter += 1;
  }
  used.add(candidate);
  return candidate;
};

const parseDelimitedLine = (line: string, delimiter: string) => {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += character;
  }
  values.push(current.trim());
  return values;
};

const delimiterScore = (lines: string[], delimiter: string) => {
  const counts = lines.slice(0, 30).map((line) => parseDelimitedLine(line, delimiter).length);
  const usable = counts.filter((count) => count >= 2);
  if (usable.length < Math.min(2, lines.length)) return 0;
  const frequency = new Map<number, number>();
  usable.forEach((count) => frequency.set(count, (frequency.get(count) ?? 0) + 1));
  const consistency = Math.max(...frequency.values()) / usable.length;
  return usable.length * consistency * Math.max(2, Math.max(...usable));
};

export const parseDelimitedDocument = (text: string, preferredDelimiter?: string): unknown[][] => {
  const cleanText = text.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
  if (!cleanText) return [];
  const lines = cleanText.split("\n").filter((line) => line.trim());
  const delimiters = preferredDelimiter ? [preferredDelimiter] : ["\t", ";", "|", ","];
  const delimiter = delimiters
    .map((candidate) => ({ candidate, score: delimiterScore(lines, candidate) }))
    .sort((left, right) => right.score - left.score)[0];
  if (!delimiter || delimiter.score === 0) return [];
  return cleanRows(lines.map((line) => parseDelimitedLine(line, delimiter.candidate)));
};

const parseKeyValueBlocks = (text: string) => {
  const blocks = text.replace(/\r/g, "").split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
  const records = blocks.map((block) => {
    const record: Record<string, string> = {};
    block.split("\n").forEach((line) => {
      const match = line.match(/^\s*([^:=]{2,80})\s*[:=]\s*(.+?)\s*$/);
      if (match) record[match[1].trim()] = match[2].trim();
    });
    return record;
  }).filter((record) => Object.keys(record).length >= 2);
  if (!records.length) return [];
  const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
  return [headers, ...records.map((record) => headers.map((header) => record[header] ?? ""))];
};

const parseAlignedText = (text: string) => {
  const lines = text.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  const rows = lines.map((line) => line.split(/\s{2,}/).map((cell) => cell.trim()).filter(Boolean));
  const usable = rows.filter((row) => row.length >= 2);
  return usable.length >= 2 ? cleanRows(usable) : [];
};

export const parseTextBusinessDocument = (text: string): unknown[][] => {
  const delimited = parseDelimitedDocument(text);
  if (delimited.length >= 2) return delimited;
  const keyValue = parseKeyValueBlocks(text);
  if (keyValue.length >= 2) return keyValue;
  return parseAlignedText(text);
};

const flattenRecord = (value: Record<string, unknown>, prefix = "", depth = 0): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (entry === null || entry === undefined || ["string", "number", "boolean"].includes(typeof entry)) {
      result[path] = entry ?? "";
    } else if (!Array.isArray(entry) && typeof entry === "object" && depth < 2) {
      Object.assign(result, flattenRecord(entry as Record<string, unknown>, path, depth + 1));
    }
  });
  return result;
};

const arrayToRows = (value: unknown[]): unknown[][] => {
  if (!value.length) return [];
  if (value.every(Array.isArray)) return cleanRows(value as unknown[][]);
  if (value.every((entry) => entry && typeof entry === "object" && !Array.isArray(entry))) {
    const records = value.map((entry) => flattenRecord(entry as Record<string, unknown>));
    const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
    return cleanRows([headers, ...records.map((record) => headers.map((header) => record[header] ?? ""))]);
  }
  return [];
};

export const parseJsonBusinessDocument = (text: string): UniversalSheetInput[] => {
  const parsed = JSON.parse(text) as unknown;
  const candidates: Array<{ name: string; rows: unknown[][] }> = [];
  const walk = (value: unknown, path: string, depth: number) => {
    if (depth > 6) return;
    if (Array.isArray(value)) {
      const rows = arrayToRows(value);
      if (rows.length >= 2) {
        candidates.push({ name: path || "Datos", rows });
        return;
      }
      value.forEach((entry, index) => walk(entry, `${path || "Datos"}_${index + 1}`, depth + 1));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => walk(entry, path ? `${path}_${key}` : key, depth + 1));
    }
  };
  walk(parsed, "", 0);
  if (!candidates.length && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const record = flattenRecord(parsed as Record<string, unknown>);
    const headers = Object.keys(record);
    if (headers.length >= 2) candidates.push({ name: "Datos", rows: [headers, headers.map((header) => record[header])] });
  }
  const used = new Set<string>();
  return candidates
    .sort((left, right) => (right.rows.length * (right.rows[0]?.length ?? 0)) - (left.rows.length * (left.rows[0]?.length ?? 0)))
    .slice(0, 20)
    .map((candidate) => ({ name: uniqueSheetName(candidate.name, used), rows: candidate.rows }));
};

export const rowsFromPdfTextItems = (items: PdfTextItem[]): unknown[][] => {
  const positioned = items.map((item) => ({
    text: item.str.trim(),
    x: item.transform?.[4] ?? 0,
    y: item.transform?.[5] ?? 0,
    width: item.width ?? Math.max(8, item.str.length * 4),
  })).filter((item) => item.text);
  const lines: Array<{ y: number; items: typeof positioned }> = [];
  positioned.sort((left, right) => right.y - left.y || left.x - right.x).forEach((item) => {
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= 2.5);
    if (line) line.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  });
  const rows = lines.sort((left, right) => right.y - left.y).map((line) => {
    const cells: string[] = [];
    let current = "";
    let previousEnd = Number.NEGATIVE_INFINITY;
    line.items.sort((left, right) => left.x - right.x).forEach((item) => {
      const gap = item.x - previousEnd;
      if (current && gap > 18) {
        cells.push(current.trim());
        current = item.text;
      } else current = `${current}${current ? " " : ""}${item.text}`;
      previousEnd = Math.max(previousEnd, item.x + item.width);
    });
    if (current) cells.push(current.trim());
    return cells;
  });
  const multiCell = rows.filter((row) => row.length >= 2);
  return multiCell.length >= 2 ? cleanRows(multiCell) : [];
};

const htmlTablesToSheets = (html: string) => {
  const document = new DOMParser().parseFromString(html, "text/html");
  return [...document.querySelectorAll("table")].map((table, index) => ({
    name: `Tabla ${index + 1}`,
    rows: cleanRows([...table.querySelectorAll("tr")].map((row) => [...row.querySelectorAll("th,td")].map((cell) => cell.textContent?.trim() ?? ""))),
  })).filter((sheet) => sheet.rows.length >= 2);
};

const extractWord = async (file: File) => {
  const mammothModule = await import("mammoth");
  const mammoth = "default" in mammothModule ? mammothModule.default : mammothModule;
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const tables = htmlTablesToSheets(htmlResult.value);
  const rawResult = await mammoth.extractRawText({ arrayBuffer });
  const fallbackRows = parseTextBusinessDocument(rawResult.value);
  return {
    sheets: tables.length ? tables : fallbackRows.length >= 2 ? [{ name: "Contenido Word", rows: fallbackRows }] : [],
    warnings: htmlResult.messages.length ? ["Word contenía elementos de formato que se simplificaron durante la extracción."] : [],
  };
};

const extractPdf = async (file: File) => {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist/build/pdf.mjs"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  const pdf = await task.promise;
  const sheets: UniversalSheetInput[] = [];
  let textCharacters = 0;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items.filter((item): item is PdfTextItem => {
      if (!item || typeof item !== "object") return false;
      return "str" in item;
    });
    textCharacters += items.reduce((sum, item) => sum + item.str.length, 0);
    let rows = rowsFromPdfTextItems(items);
    if (rows.length < 2) {
      const lines = items.map((item) => item.str).join(" ");
      rows = parseTextBusinessDocument(lines);
    }
    if (rows.length >= 2) sheets.push({ name: `Página ${pageNumber}`, rows });
  }
  await pdf.destroy();
  const warnings: string[] = [];
  if (!textCharacters) warnings.push("El PDF parece escaneado y no contiene texto seleccionable. Necesita OCR o una exportación digital.");
  else warnings.push("PDF interpretado por posición visual. Revisa la fila de encabezados y el mapeo antes de confirmar.");
  return { sheets, warnings };
};

export const supportedDocumentExtension = (filename: string): SupportedDocumentFormat | null => {
  const extension = filename.toLowerCase().split(".").pop();
  return extension && extension in FORMAT_LABELS ? extension as SupportedDocumentFormat : null;
};

export async function extractBusinessDocument(file: File): Promise<ExtractedBusinessDocument> {
  const format = supportedDocumentExtension(file.name);
  if (!format) throw new Error("Formato no compatible. Utiliza XLSX, CSV, TSV, JSON, PDF, DOCX o TXT.");
  const warnings: string[] = [];
  let sheets: UniversalSheetInput[] = [];
  if (format === "xlsx") {
    const { default: readWorkbook } = await import("read-excel-file/browser");
    const workbook = await readWorkbook(file) as Array<{ sheet: string; data: unknown[][] }>;
    sheets = workbook.map((sheet) => ({ name: sheet.sheet, rows: cleanRows(sheet.data) }));
  } else if (format === "json") {
    sheets = parseJsonBusinessDocument(await file.text());
  } else if (format === "docx") {
    const word = await extractWord(file);
    sheets = word.sheets;
    warnings.push(...word.warnings);
  } else if (format === "pdf") {
    const pdf = await extractPdf(file);
    sheets = pdf.sheets;
    warnings.push(...pdf.warnings);
  } else {
    const text = await file.text();
    const rows = format === "tsv" ? parseDelimitedDocument(text, "\t") : parseTextBusinessDocument(text);
    if (rows.length >= 2) sheets = [{ name: "Datos", rows }];
  }
  sheets = sheets.filter((sheet) => sheet.rows.length >= 2 && sheet.rows.some((row) => row.length >= 2));
  if (!sheets.length) {
    throw new Error(format === "pdf"
      ? "No encontramos una tabla de texto utilizable en el PDF. Si es una imagen escaneada, aplica OCR o expórtala a Excel/CSV."
      : "No encontramos una tabla o registros estructurados que puedan traducirse.");
  }
  return { format, formatLabel: FORMAT_LABELS[format], sheets, warnings };
}
