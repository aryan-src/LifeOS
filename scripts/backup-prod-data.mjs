import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read .env.local
const envLocalPath = path.join(rootDir, '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.error(`Error: .env.local not found at ${envLocalPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envLocalPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const equalsIdx = trimmed.indexOf('=');
  if (equalsIdx !== -1) {
    const key = trimmed.slice(0, equalsIdx).trim();
    const val = trimmed.slice(equalsIdx + 1).trim();
    envVars[key] = val;
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing in .env.local');
  process.exit(1);
}

console.log(`Connecting to Supabase at: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

const TABLES = [
  'profiles',
  'projects',
  'tasks',
  'categories',
  'transactions',
  'notes',
  'assignments',
  'habits',
  'habit_logs',
];

// Helper to convert array of objects to CSV
function jsonToCsv(items) {
  if (!items || items.length === 0) return '';
  const headers = Array.from(
    new Set(items.flatMap((item) => Object.keys(item)))
  );

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const rows = items.map((item) =>
    headers.map((header) => escapeCell(item[header])).join(',')
  );

  return [headerRow, ...rows].join('\n');
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDir = path.join(rootDir, 'backups', 'phase-0-snapshot');
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`\n========================================`);
  console.log(`Starting Phase 0 Production Data Backup`);
  console.log(`Output Directory: ${targetDir}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`========================================\n`);

  const summary = {};
  const fullPayload = {
    timestamp,
    supabaseUrl,
    tables: {},
  };

  for (const table of TABLES) {
    process.stdout.write(`Fetching '${table}'... `);
    const { data, error } = await supabase.from(table).select('*');

    if (error) {
      console.error(`FAILED: ${error.message}`);
      summary[table] = { status: 'error', error: error.message, count: 0 };
      continue;
    }

    const rowCount = data?.length || 0;
    summary[table] = { status: 'success', count: rowCount };
    fullPayload.tables[table] = data || [];
    console.log(`✓ (${rowCount} rows)`);

    // Write table-specific JSON (timestamped and latest)
    fs.writeFileSync(
      path.join(targetDir, `${table}.json`),
      JSON.stringify(data || [], null, 2),
      'utf-8'
    );
    fs.writeFileSync(
      path.join(targetDir, `${table}-${timestamp}.json`),
      JSON.stringify(data || [], null, 2),
      'utf-8'
    );

    // Write table-specific CSV (timestamped and latest)
    const csvData = jsonToCsv(data || []);
    fs.writeFileSync(path.join(targetDir, `${table}.csv`), csvData, 'utf-8');
    fs.writeFileSync(path.join(targetDir, `${table}-${timestamp}.csv`), csvData, 'utf-8');
  }

  // Write full snapshot payload with metadata
  fs.writeFileSync(
    path.join(targetDir, `full-snapshot-${timestamp}.json`),
    JSON.stringify(fullPayload, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(targetDir, `summary.json`),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );

  console.log(`\n========================================`);
  console.log(`Backup Complete! Summary of Rows:`);
  console.log(`========================================`);
  for (const [tbl, res] of Object.entries(summary)) {
    console.log(`  - ${tbl.padEnd(15)}: ${res.count} rows (${res.status})`);
  }
  console.log(`\nAll files saved inside: ${targetDir}\n`);
}

runBackup().catch((err) => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
