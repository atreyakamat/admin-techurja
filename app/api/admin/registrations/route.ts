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
           const reg: any = records[0];
           
           reg.id = reg.id || folderName;
           reg.institution = reg.institution || reg['Institution Name'] || reg['college'] || reg['College'] || '—';
           
           // Normalize participant fields and calculate count
           let count = 1; // Lead is always there
           reg.participant1 = reg.participant1 || reg['name'] || reg['Name'] || reg['Lead Name'] || '';
           
           reg.participant2 = reg.participant2 || reg['Participant 2 Name'] || reg['p2Name'] || '';
           if (reg.participant2 && reg.participant2 !== '—') count++;
           
           reg.participant3 = reg.participant3 || reg['Participant 3 Name'] || reg['p3Name'] || '';
           if (reg.participant3 && reg.participant3 !== '—') count++;
           
           reg.participant4 = reg.participant4 || reg['Participant 4 Name'] || reg['p4Name'] || '';
           if (reg.participant4 && reg.participant4 !== '—') count++;

           reg.participantCount = count;

           reg.isAccepted = parseInt(reg.isAccepted || '0');
           reg.status = reg.status || 'pending';
           reg.needsAccommodation = reg.needsAccommodation === 'true' || reg.needsAccommodation === '1' || reg.needsAccommodation === 'YES';
           reg.createdAt = reg.createdAt || new Date().toISOString();

           const searchString = `${reg.name || ''} ${reg.participant1 || ''} ${reg.email || ''} ${reg.teamName || ''} ${reg.transactionId || ''} ${reg.institution || ''} ${reg.eventName || ''}`.toLowerCase();
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
