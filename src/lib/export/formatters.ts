/**
 * Utilities for exporting LifeOS data to Obsidian-friendly Markdown, RFC-4180 CSV, and ZIP archives.
 */

export interface NoteExportItem {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at?: string;
  project?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export interface TransactionExportItem {
  id: string;
  date: string;
  amount: number;
  type: string;
  description: string;
  category?: {
    name: string;
  } | null;
}

export interface AssignmentExportItem {
  id: string;
  title: string;
  subject: string;
  due_date: string | null;
  status: string;
  marks_achieved: number | null;
  total_marks: number | null;
  project?: {
    title: string;
  } | null;
}

export interface TaskExportItem {
  id: string;
  title: string;
  is_completed: boolean;
  priority: number;
  due_date: string | null;
  created_at: string;
}

export interface HabitExportItem {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

/**
 * Escapes a string value for safe YAML frontmatter emission.
 */
export function escapeYamlString(val: string): string {
  if (/[\n\r"':#&*[\]{}|>?!%@`,\\]/.test(val) || val.trim() !== val || val === '') {
    return JSON.stringify(val);
  }
  return val;
}

/**
 * Formats a Note into Obsidian-compatible Markdown with clean YAML frontmatter.
 */
export function formatNoteAsMarkdown(note: NoteExportItem): string {
  const frontmatterLines: string[] = [
    '---',
    `title: ${escapeYamlString(note.title || 'Untitled Note')}`,
    `created_at: "${note.created_at}"`,
  ];

  if (note.updated_at) {
    frontmatterLines.push(`updated_at: "${note.updated_at}"`);
  }

  if (note.project?.title) {
    frontmatterLines.push(`project: ${escapeYamlString(note.project.title)}`);
  }

  frontmatterLines.push('source: "LifeOS"');
  frontmatterLines.push('---');

  const body = (note.content || '').trim();
  return `${frontmatterLines.join('\n')}\n\n${body}\n`;
}

/**
 * Escapes a single CSV cell according to RFC-4180 specification:
 * - If the cell contains commas, quotes, or newlines, surround with double quotes.
 * - Any internal double quotes are escaped by doubling them ("").
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a table of rows into an RFC-4180 compliant CSV string.
 */
export function formatAsCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsvField).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Formats transactions into an RFC-4180 CSV table.
 */
export function formatTransactionsCsv(transactions: TransactionExportItem[]): string {
  const headers = ['ID', 'Date', 'Type', 'Amount', 'Description', 'Category'];
  const rows = transactions.map((tx) => [
    tx.id,
    tx.date,
    tx.type,
    tx.amount,
    tx.description,
    tx.category?.name || 'Uncategorized',
  ]);
  return formatAsCsv(headers, rows);
}

/**
 * Formats assignments into an RFC-4180 CSV table.
 */
export function formatAssignmentsCsv(assignments: AssignmentExportItem[]): string {
  const headers = ['ID', 'Subject', 'Title', 'Due Date', 'Status', 'Marks Achieved', 'Total Marks', 'Project'];
  const rows = assignments.map((a) => [
    a.id,
    a.subject,
    a.title,
    a.due_date || '',
    a.status,
    a.marks_achieved,
    a.total_marks,
    a.project?.title || '',
  ]);
  return formatAsCsv(headers, rows);
}

/**
 * Formats tasks into an RFC-4180 CSV table.
 */
export function formatTasksCsv(tasks: TaskExportItem[]): string {
  const headers = ['ID', 'Title', 'Completed', 'Priority', 'Due Date', 'Created At'];
  const rows = tasks.map((t) => [
    t.id,
    t.title,
    t.is_completed ? 'Yes' : 'No',
    t.priority,
    t.due_date || '',
    t.created_at,
  ]);
  return formatAsCsv(headers, rows);
}

/**
 * Formats habits into an RFC-4180 CSV table.
 */
export function formatHabitsCsv(habits: HabitExportItem[]): string {
  const headers = ['ID', 'Title', 'Description', 'Created At'];
  const rows = habits.map((h) => [
    h.id,
    h.title,
    h.description || '',
    h.created_at,
  ]);
  return formatAsCsv(headers, rows);
}

/**
 * Lightweight, zero-dependency pure TypeScript uncompressed ZIP archive generator.
 * Produces standard ZIP files matching PKZIP 2.0 specifications.
 */
export function createZipArchive(files: Array<{ name: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const fileRecords: Array<{
    nameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  // CRC-32 table computation
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c;
  }

  function computeCrc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // Write Local File Headers + Data
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const crc = computeCrc32(contentBytes);
    const offset = currentOffset;

    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true); // Local header signature: PK\x03\x04
    view.setUint16(4, 20, true); // Version needed (2.0)
    view.setUint16(6, 0x0800, true); // General flags (UTF-8)
    view.setUint16(8, 0, true); // Compression method (0 = uncompressed store)
    view.setUint16(10, 0, true); // Mod time
    view.setUint16(12, 0, true); // Mod date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, contentBytes.length, true); // Compressed size
    view.setUint32(22, contentBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    header.set(nameBytes, 30);

    chunks.push(header, contentBytes);
    currentOffset += header.length + contentBytes.length;

    fileRecords.push({
      nameBytes,
      contentBytes,
      crc,
      offset,
    });
  }

  // Central Directory
  const cdOffset = currentOffset;
  let cdSize = 0;

  for (const rec of fileRecords) {
    const cdHeader = new Uint8Array(46 + rec.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central header signature: PK\x01\x02
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed
    view.setUint16(8, 0x0800, true); // Flags (UTF-8)
    view.setUint16(10, 0, true); // Compression method (0)
    view.setUint16(12, 0, true); // Mod time
    view.setUint16(14, 0, true); // Mod date
    view.setUint32(16, rec.crc, true); // CRC-32
    view.setUint32(20, rec.contentBytes.length, true); // Compressed size
    view.setUint32(24, rec.contentBytes.length, true); // Uncompressed size
    view.setUint16(28, rec.nameBytes.length, true); // Name length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal attributes
    view.setUint32(38, 0, true); // External attributes
    view.setUint32(42, rec.offset, true); // Relative offset of local header
    cdHeader.set(rec.nameBytes, 46);

    chunks.push(cdHeader);
    cdSize += cdHeader.length;
  }

  // End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature: PK\x05\x06
  eocdView.setUint16(4, 0, true); // Disk number
  eocdView.setUint16(6, 0, true); // Disk with central directory
  eocdView.setUint16(8, fileRecords.length, true); // Total entries on this disk
  eocdView.setUint16(10, fileRecords.length, true); // Total entries
  eocdView.setUint32(12, cdSize, true); // Size of central directory
  eocdView.setUint32(16, cdOffset, true); // Offset of central directory
  eocdView.setUint16(20, 0, true); // Comment length

  chunks.push(eocd);

  return new Blob(chunks as BlobPart[], { type: 'application/zip' });
}
