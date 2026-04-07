import { parse } from 'csv-parse/sync';

export function parseKeyValueCsv(content: string): Record<string, string> {
  const records = parse(content, {
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  });

  const result: Record<string, string> = {};
  for (const row of records) {
    if (row.length >= 2) {
      result[row[0]] = row[1] || '';
    }
  }
  return result;
}

export function parseTableCsv(content: string): Record<string, string>[] {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  });
}
