import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';

// Utility to get the FTP client
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
  const eventFrom = searchParams.get('event_from') || '';
  const eventTo = searchParams.get('event_to') || '';

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
    const stats = {
      total: 0,
      pending: 0,
      verified: 0,
      rejected: 0,
    };
    
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
        
        const records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
        
        if (records.length > 0) {
           const record: any = records[0];
           const reg: any = {};
           
           // Helper for case-insensitive and whitespace-resilient lookups
           const getVal = (keys: string[]) => {
             const recordKeys = Object.keys(record);
             for (const k of keys) {
               const foundKey = recordKeys.find(rk => rk.trim().toLowerCase() === k.toLowerCase());
               if (foundKey !== undefined) return record[foundKey];
             }
             return undefined;
           };

           // Store original record for debug/raw view
           reg._raw = { ...record };
           
           // Mapping with aggressive fallbacks
           reg.id = getVal(['id', 'ID', 'registrationId', 'Registration ID']) || folderName;
           reg.name = getVal(['name', 'Name', 'Lead Name', 'Lead', 'participant1', 'Full Name', 'Participant 1 Name']) || '—';
           reg.email = getVal(['email', 'Email', 'Lead Email', 'participant1Email']) || '—';
           reg.phone = getVal(['phone', 'Phone', 'Lead Phone', 'Contact', 'Mobile', 'participant1Phone']) || '—';
           reg.eventName = getVal(['eventName', 'Event', 'Event Name', 'event']) || '—';
           reg.teamName = getVal(['teamName', 'Team Name', 'team', 'Team', 'Teamname']) || '—';
           reg.transactionId = getVal(['transactionId', 'UTR', 'Transaction ID', 'UTR Number', 'utr', 'TransactionID']) || '—';
           reg.institution = getVal(['institution', 'Institution Name', 'college', 'College', 'Institution', 'School', 'University']) || '—';
           
           // Participant Logic
           let count = 1;
           reg.participant1 = reg.name;
           
           reg.participant2 = getVal(['participant2', 'Participant 2 Name', 'p2Name', 'Member 2 Name']) || '';
           if (reg.participant2 && reg.participant2 !== '—' && reg.participant2 !== '') count++;
           
           reg.participant3 = getVal(['participant3', 'Participant 3 Name', 'p3Name', 'Member 3 Name']) || '';
           if (reg.participant3 && reg.participant3 !== '—' && reg.participant3 !== '') count++;
           
           reg.participant4 = getVal(['participant4', 'Participant 4 Name', 'p4Name', 'Member 4 Name']) || '';
           if (reg.participant4 && reg.participant4 !== '—' && reg.participant4 !== '') count++;

           reg.participantCount = count;
           
           const acceptedRaw = getVal(['isAccepted', 'accepted', 'Accepted', 'status_accepted']);
           reg.isAccepted = parseInt(acceptedRaw || '0');
           
           reg.status = getVal(['status', 'Status', 'Registration Status']) || 'pending';
           
           const accomRaw = String(getVal(['needsAccommodation', 'needs_accommodation', 'Needs Accommodation', 'Accommodation', 'accommodation']) || '').toUpperCase();
           reg.needsAccommodation = ['TRUE', '1', 'YES', 'Y', 'NEEDED', 'REQUIRED'].includes(accomRaw);
           
           reg.createdAt = getVal(['createdAt', 'Date', 'Timestamp', 'Created At', 'date']) || new Date().toISOString();

           const searchString = `${reg.id} ${reg.name} ${reg.email} ${reg.teamName} ${reg.transactionId} ${reg.institution} ${reg.eventName} ${JSON.stringify(reg._raw)}`.toLowerCase();
           let match = true;
           
           if (search && !searchString.includes(search)) match = false;
           if (statusFilter && reg.status !== statusFilter) match = false;
           if (eventFilter && !(reg.eventName || '').toLowerCase().includes(eventFilter)) match = false;
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

           if (match) {
               registrations.push(reg);
           }

           stats.total++;
           if (reg.status === 'pending') stats.pending++;
           if (reg.status === 'verified') stats.verified++;
           if (reg.status === 'rejected') stats.rejected++;
        }
      } catch (e) {
        console.warn(`[FTP_SKIP]: Failed to fetch details.csv for ${folderName}`);
      }
    }

    client.close();

    registrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ registrations, stats });
  } catch (error: any) {
    if (client) client.close();
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
