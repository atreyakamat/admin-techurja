import { parse } from 'csv-parse/sync';

export function parseCsvContent(csvContent: string): Record<string, string> {
  try {
    const records = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });

    // Handle Key-Value format (two columns)
    const isKeyValue = records.length > 0 && records.every((r: any) => r.length === 2);

    if (isKeyValue) {
      const result: Record<string, string> = {};
      for (const row of records) {
        result[row[0]] = row[1] || '';
      }
      return result;
    }

    // Handle Table format (headers in first row)
    if (records.length >= 2) {
      const headers = records[0];
      const data = records[1];
      const result: Record<string, string> = {};
      headers.forEach((h: string, i: number) => {
        result[h] = data[i] || '';
      });
      return result;
    }
  } catch (e) {
    console.error('CSV Parse Error:', e);
  }
  return {};
}

export function getVal(record: Record<string, string>, keys: string[]): string | undefined {
  for (const k of keys) {
    const foundKey = Object.keys(record).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
    if (foundKey !== undefined) {
      const val = record[foundKey];
      if (val && val.toUpperCase() !== 'N/A') return val;
    }
  }
  return undefined;
}

export const normalizationMap: Record<string, string> = {
  'lfr': 'Grid Runner',
  'line follower robot': 'Grid Runner',
  'line follower': 'Grid Runner',
  'the cypher heist': 'The Cyber Heist',
  'cypher heist': 'The Cyber Heist',
  'cyber heist': 'The Cyber Heist',
  'heist': 'The Cyber Heist',
  'roborace': 'L9: Santo Domingo Race',
  'race': 'L9: Santo Domingo Race',
  'marketing pitch': 'War Room Protocol',
  'war room': 'War Room Protocol',
  'circuit debugging': 'Circuit Breach',
  'debugging': 'Circuit Breach',
  'circuit': 'Circuit Breach',
  'virtual cricket': 'Cyber Smashers',
  'cricket': 'Cyber Smashers',
  'clash royale': 'Clashpunk',
  'clash': 'Clashpunk',
  'fifa': 'Pixel Play',
  'fifa 24': 'Pixel Play',
  'bridge building': 'Neon Span',
  'bridge': 'Neon Span',
  'robo sumo': 'Robo Nexus',
  'sumo': 'Robo Nexus',
  'robo soccer': 'Cyber Strike',
  'soccer': 'Cyber Strike',
  'robomaze': 'Kabuki Roundabout',
  'maze': 'Kabuki Roundabout',
  'coding challenge': 'Escape the Matrix',
  'coding': 'Escape the Matrix',
  'ctf challenge': 'Ghostgrid',
  'ctf': 'Ghostgrid',
  'abstract art designing': 'Symmetry Art',
  'art': 'Symmetry Art',
  'straw structure designing': 'Structomat',
  'straw': 'Structomat',
  'project expo': 'Innovibe',
  'expo': 'Innovibe',
  'robo tug of war': 'Cyber Tug',
  'tug of war': 'Cyber Tug',
  'tug': 'Cyber Tug'
};

export function normalizeEventName(rawName: string): string {
  if (!rawName || rawName === '—') return rawName;
  const normalized = normalizationMap[rawName.toLowerCase().trim()];
  return normalized || rawName;
}

export function parseRegistrationDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try parsing ISO format or other standard formats
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  // Try DD/MM/YYYY
  const dmY = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmY) {
    return new Date(parseInt(dmY[3]), parseInt(dmY[2]) - 1, parseInt(dmY[1]));
  }

  // Try YYYY-MM-DD (already handled by new Date() usually, but just in case)
  const Ymd = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (Ymd) {
    return new Date(parseInt(Ymd[1]), parseInt(Ymd[2]) - 1, parseInt(Ymd[3]));
  }

  return new Date(); // Fallback to current date
}
