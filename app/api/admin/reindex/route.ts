import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import { Readable } from 'stream';

function parseCsvContent(csvContent: string): Record<string, string> {
  try {
    const records = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });

    const isKeyValue = records.length > 0 && records.every((r: any) => r.length === 2);

    if (isKeyValue) {
      const result: Record<string, string> = {};
      for (const row of records) {
        result[row[0]] = row[1] || '';
      }
      return result;
    }

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

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    const registrationsPath = '/registrations/';
    const folders = await client.list(registrationsPath);
    const targetFolders = folders.filter(f => f.isDirectory);
    
    const registrations: any[] = [];
    const stats = { total: 0, pending: 0, verified: 0, rejected: 0 };

    console.log(`Starting re-index for ${targetFolders.length} folders...`);

    for (const folder of targetFolders) {
      const folderName = folder.name;
      const csvPath = `${registrationsPath}${folderName}/details.csv`;
      
      try {
        const chunks: Buffer[] = [];
        const { Writable } = await import('stream');
        const writable = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
          }
        });

        await client.downloadTo(writable, csvPath);
        const buffer = Buffer.concat(chunks);
        const csvContent = buffer.toString('utf-8');
        const record = parseCsvContent(csvContent);
        
        if (Object.keys(record).length === 0) continue;

        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const foundKey = Object.keys(record).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
            if (foundKey !== undefined) {
              const val = record[foundKey];
              if (val && val.toUpperCase() !== 'N/A') return val;
            }
          }
          return undefined;
        };

        const reg: any = { _raw: { ...record } };
        reg.id = folderName;
        reg.name = getVal(['name']) || '—';
        reg.email = getVal(['email']) || '—';
        reg.phone = getVal(['phone']) || '—';
        const rawEventName = getVal(['event_name', 'eventName', 'Event Name', 'Event']) || '—';
        
        // Normalize Event Name
        const normalizationMap: Record<string, string> = {
          'lfr': 'Grid Runner',
          'line follower robot': 'Grid Runner',
          'line follower': 'Grid Runner',
          'the cypher heist': 'The Cyber Heist',
          'cypher heist': 'The Cyber Heist',
          'cyber heist': 'The Cyber Heist',
          'roborace': 'L9: Santo Domingo Race',
          'marketing pitch': 'War Room Protocol',
          'circuit debugging': 'Circuit Breach',
          'virtual cricket': 'Cyber Smashers',
          'clash royale': 'Clashpunk',
          'fifa': 'Pixel Play',
          'bridge building': 'Neon Span',
          'robo sumo': 'Robo Nexus',
          'robo soccer': 'Cyber Strike',
          'robomaze': 'Kabuki Roundabout',
          'coding challenge': 'Escape the Matrix',
          'ctf challenge': 'Ghostgrid',
          'abstract art designing': 'Symmetry Art',
          'straw structure designing': 'Structomat',
          'project expo': 'Innovibe',
          'robo tug of war': 'Cyber Tug'
        };

        const normalized = normalizationMap[rawEventName.toLowerCase().trim()];
        reg.eventName = normalized || rawEventName;
        
        reg.teamName = getVal(['team_name', 'teamName', 'Team Name', 'Team']) || '—';
        reg.transactionId = getVal(['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—';
        reg.institution = getVal(['institution', 'college', 'College', 'Institution Name']) || '—';
        
        let count = 1;
        for (let i = 2; i <= 4; i++) {
          const pName = getVal([`participant${i}`, `Participant ${i} Name`]);
          if (pName) count++;
        }
        reg.participantCount = count;

        const status = getVal(['status', 'Status']) || 'pending';
        reg.status = status.toLowerCase();
        reg.isAccepted = parseInt(getVal(['isAccepted', 'accepted']) || (reg.status === 'verified' ? '1' : '0'));
        
        const accom = String(getVal(['needs_accommodation', 'needsAccommodation', 'Accommodation']) || '').toUpperCase();
        reg.needsAccommodation = ['YES', 'TRUE', '1', 'NEEDED'].includes(accom);
        
        reg.createdAt = getVal(['timestamp', 'createdAt', 'Date', 'date']) || new Date().toISOString();

        registrations.push(reg);
        stats.total++;
        if (reg.status === 'verified') stats.verified++;
        else if (reg.status === 'rejected') stats.rejected++;
        else stats.pending++;

      } catch (e) {
        console.warn(`Skip ${folderName}`);
      }
    }

    // Save the combined data back to FTP as a master JSON file
    const masterData = {
      lastUpdated: new Date().toISOString(),
      stats,
      registrations
    };

    const stream = Readable.from(JSON.stringify(masterData));
    await client.uploadFrom(stream, '/registrations_master.json');

    return NextResponse.json({ 
      success: true, 
      message: `Re-indexed ${registrations.length} registrations.`,
      stats 
    });

  } catch (error: any) {
    console.error('Re-index Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.close();
  }
}
