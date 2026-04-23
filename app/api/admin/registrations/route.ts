import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parseCsvContent, getVal, normalizeEventName, parseRegistrationDate } from '@/lib/csv-utils';

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

  let client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    const registrationsPath = '/registrations/';
    const masterPath = '/registrations_master.json';
    
    let registrations: any[] = [];
    let stats = { total: 0, pending: 0, verified: 0, rejected: 0 };
    let useFallback = false;

    // TRY LOADING FROM MASTER JSON FIRST
    try {
        const chunks: Buffer[] = [];
        const { Writable } = await import('stream');
        const writable = new Writable({
            write(chunk, encoding, callback) {
                chunks.push(chunk);
                callback();
            }
        });
        await client.downloadTo(writable, masterPath);
        const data = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
        registrations = data.registrations || [];
        stats = data.stats || { total: 0, pending: 0, verified: 0, rejected: 0 };
    } catch (e) {
        useFallback = true;
    }

    if (useFallback) {
        let folders: ftp.FileInfo[] = [];
        try {
            folders = await client.list(registrationsPath);
        } catch(e) {
            folders = [];
        }

        const targetFolders = folders.filter(f => f.isDirectory);
        
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

            const reg: any = { _raw: { ...record } };
            reg.id = folderName;
            reg.name = getVal(record, ['name']) || '—';
            reg.email = getVal(record, ['email']) || '—';
            reg.phone = getVal(record, ['phone']) || '—';
            
            const rawEventName = getVal(record, ['event_name', 'eventName', 'Event Name', 'Event']) || '—';
            reg.eventName = normalizeEventName(rawEventName);
            
            reg.teamName = getVal(record, ['team_name', 'teamName', 'Team Name', 'Team']) || '—';
            reg.transactionId = getVal(record, ['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—';
            reg.institution = getVal(record, ['institution', 'college', 'College', 'Institution Name']) || '—';
            
            let count = 1;
            for (let i = 2; i <= 4; i++) {
              const pName = getVal(record, [`participant${i}`, `Participant ${i} Name`]);
              if (pName) count++;
            }
            reg.participantCount = count;

            const status = getVal(record, ['status', 'Status']) || 'pending';
            reg.status = status.toLowerCase();
            reg.isAccepted = parseInt(getVal(record, ['isAccepted', 'accepted']) || (reg.status === 'verified' ? '1' : '0'));
            
            const accom = String(getVal(record, ['needs_accommodation', 'needsAccommodation', 'Accommodation']) || '').toUpperCase();
            reg.needsAccommodation = ['YES', 'TRUE', '1', 'NEEDED'].includes(accom);
            
            const rawDate = getVal(record, ['timestamp', 'createdAt', 'Date', 'date']);
            reg.createdAt = rawDate ? parseRegistrationDate(rawDate).toISOString() : new Date().toISOString();

            registrations.push(reg);
            stats.total++;
            if (reg.status === 'verified') stats.verified++;
            else if (reg.status === 'rejected') stats.rejected++;
            else stats.pending++;
          } catch (e) { /* skip */ }
        }
    }

    // APPLY FILTERS
    let filteredRegs = registrations;
    if (search || statusFilter || eventFilter || categoryFilter || isAcceptedFilter !== 'all' || regFrom || regTo) {
        filteredRegs = registrations.filter(reg => {
            const searchString = `${reg.id} ${reg.name} ${reg.email} ${reg.teamName} ${reg.transactionId} ${reg.institution} ${reg.eventName} ${JSON.stringify(reg._raw)}`.toLowerCase();
            
            if (search && !searchString.includes(search)) return false;
            if (statusFilter && reg.status !== statusFilter) return false;
            if (eventFilter && !reg.eventName.toLowerCase().includes(eventFilter)) return false;
            if (categoryFilter && !(reg.category || '').toLowerCase().includes(categoryFilter)) return false;
            if (isAcceptedFilter !== 'all') {
                const acceptedVal = isAcceptedFilter === 'accepted' ? 1 : 0;
                if (reg.isAccepted !== acceptedVal) return false;
            }
            if (regFrom) {
                const regDate = parseRegistrationDate(reg.createdAt);
                const fromDate = parseRegistrationDate(regFrom);
                if (regDate < fromDate) return false;
            }
            if (regTo) {
                const regDate = parseRegistrationDate(reg.createdAt);
                const toDate = parseRegistrationDate(regTo);
                toDate.setHours(23, 59, 59, 999);
                if (regDate > toDate) return false;
            }
            return true;
        });
    }

    filteredRegs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ registrations: filteredRegs, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.close();
  }
}
