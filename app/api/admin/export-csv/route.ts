import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

async function getFtpClient() {
  const client = new ftp.Client();
  await client.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    port: parseInt(process.env.FTP_PORT || '21'),
    secure: false,
  });
  return client;
}

function parseCsvContent(csvContent: string): Record<string, string> {
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

  return {};
}

export async function GET(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const statusFilter = searchParams.get('status') || '';
  const eventFilter = searchParams.get('event')?.toLowerCase() || '';
  const categoryFilter = searchParams.get('category')?.toLowerCase() || '';
  const isAcceptedFilter = searchParams.get('isAccepted') || 'all';
  const regFrom = searchParams.get('reg_from') || '';
  const regTo = searchParams.get('reg_to') || '';

  let client;
  try {
    client = await getFtpClient();
    const registrationsPath = '/registrations/';
    
    let folders: ftp.FileInfo[] = [];
    try {
        folders = await client.list(registrationsPath);
    } catch(e) {
        folders = [];
    }

    const targetFolders = folders.filter(f => f.isDirectory);
    const registrations: any[] = [];
    
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

        const reg: any = {};
        reg.id = folderName;
        reg.name = getVal(['name']) || '—';
        reg.email = getVal(['email']) || '—';
        reg.phone = getVal(['phone']) || '—';
        reg.eventName = getVal(['event_name', 'eventName', 'Event Name', 'Event']) || '—';
        reg.teamName = getVal(['team_name', 'teamName', 'Team Name', 'Team']) || '—';
        reg.transactionId = getVal(['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—';
        reg.institution = getVal(['institution', 'college', 'College', 'Institution Name']) || '—';
        
        for (let i = 2; i <= 4; i++) {
          reg[`participant${i}`] = getVal([`participant${i}`, `Participant ${i} Name`]) || '—';
          reg[`email${i}`] = getVal([`email${i}`, `Participant ${i} Email`]) || '—';
          reg[`phone${i}`] = getVal([`phone${i}`, `Participant ${i} Phone`]) || '—';
        }

        const status = getVal(['status', 'Status']) || 'pending';
        reg.status = status.toLowerCase();
        reg.isAccepted = parseInt(getVal(['isAccepted', 'accepted']) || (reg.status === 'verified' ? '1' : '0'));
        
        const accom = String(getVal(['needs_accommodation', 'needsAccommodation', 'Accommodation']) || '').toUpperCase();
        reg.needsAccommodation = ['YES', 'TRUE', '1', 'NEEDED'].includes(accom);
        
        reg.createdAt = getVal(['timestamp', 'createdAt', 'Date', 'date']) || new Date().toISOString();

        const searchString = `${reg.id} ${reg.name} ${reg.email} ${reg.teamName} ${reg.transactionId} ${reg.institution} ${reg.eventName}`.toLowerCase();
        let match = true;
        
        if (search && !searchString.includes(search)) match = false;
        if (statusFilter && reg.status !== statusFilter) match = false;
        if (eventFilter && !reg.eventName.toLowerCase().includes(eventFilter)) match = false;
        if (categoryFilter && !(reg.category || '').toLowerCase().includes(categoryFilter)) match = false;
        if (isAcceptedFilter !== 'all') {
          const acceptedVal = isAcceptedFilter === 'accepted' ? 1 : 0;
          if (reg.isAccepted !== acceptedVal) match = false;
        }
        if (regFrom) {
          const regDate = new Date(reg.createdAt);
          const fromDate = new Date(regFrom);
          if (regDate < fromDate) match = false;
        }
        if (regTo) {
          const regDate = new Date(reg.createdAt);
          const toDate = new Date(regTo);
          toDate.setHours(23, 59, 59, 999);
          if (regDate > toDate) match = false;
        }

        if (match) registrations.push(reg);
      } catch (e) {
        console.warn(`[FTP_SKIP]: Failed to fetch details.csv for ${folderName}`);
      }
    }

    client.close();

    registrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const headers = [
      'ID', 'Event', 'Team Name', 'Lead Name', 'Lead Email', 'Lead Phone',
      'P2 Name', 'P2 Email', 'P2 Phone',
      'P3 Name', 'P3 Email', 'P3 Phone',
      'P4 Name', 'P4 Email', 'P4 Phone',
      'Institution', 'UTR', 'Accommodation', 'Status', 'Date'
    ];

    const rows = registrations.map(reg => [
      reg.id,
      reg.eventName,
      reg.teamName || '—',
      reg.name,
      reg.email,
      reg.phone,
      reg.participant2 || '—', reg.email2 || '—', reg.phone2 || '—',
      reg.participant3 || '—', reg.email3 || '—', reg.phone3 || '—',
      reg.participant4 || '—', reg.email4 || '—', reg.phone4 || '—',
      reg.institution,
      reg.transactionId || '—',
      reg.needsAccommodation ? 'YES' : 'NO',
      reg.status,
      new Date(reg.createdAt).toLocaleDateString()
    ]);

    const csvContent = stringify(rows, {
      header: true,
      columns: headers,
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="registrations_${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (error: any) {
    if (client) client.close();
    console.error('Export API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
