import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parseCsvContent, getVal, normalizeEventName, parseRegistrationDate } from '@/lib/csv-utils';

const EMPTY_STATS = { total: 0, pending: 0, verified: 0, rejected: 0 };

async function downloadTextFile(client: ftp.Client, path: string): Promise<string> {
  const chunks: Buffer[] = [];
  const { Writable } = await import('stream');
  const writable = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    }
  });
  await client.downloadTo(writable, path);
  return Buffer.concat(chunks).toString('utf-8');
}

function toRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const record: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    record[key] = val == null ? '' : String(val);
  }
  return record;
}

function normalizeStatus(status: string): 'pending' | 'verified' | 'rejected' {
  const normalized = status.toLowerCase();
  if (normalized === 'verified' || normalized === 'rejected') return normalized;
  return 'pending';
}

function normalizeRegistration(registration: any, fallbackId = '') {
  const rawRecord = toRecord(registration?._raw);
  const mergedRecord = { ...rawRecord, ...toRecord(registration) };

  const id = String(registration?.id || getVal(mergedRecord, ['id', 'registration_id', 'reg_id']) || fallbackId).trim();
  const status = normalizeStatus(
    String(getVal(mergedRecord, ['status', 'Status']) || registration?.status || 'pending')
  );

  const participant2 = getVal(mergedRecord, ['participant2', 'Participant 2 Name']) || '';
  const participant3 = getVal(mergedRecord, ['participant3', 'Participant 3 Name']) || '';
  const participant4 = getVal(mergedRecord, ['participant4', 'Participant 4 Name']) || '';
  const participantCountFromData = Number.parseInt(
    String(registration?.participantCount || getVal(mergedRecord, ['participantCount'])),
    10
  );
  const participantCount = Number.isFinite(participantCountFromData) && participantCountFromData > 0
    ? participantCountFromData
    : 1 + [participant2, participant3, participant4].filter(Boolean).length;

  const isAcceptedValue = Number.parseInt(
    String(getVal(mergedRecord, ['isAccepted', 'accepted']) || registration?.isAccepted || ''),
    10
  );
  const isAccepted = Number.isFinite(isAcceptedValue) ? isAcceptedValue : (status === 'verified' ? 1 : 0);

  const accommodationValue = String(
    getVal(mergedRecord, ['needs_accommodation', 'needsAccommodation', 'Accommodation']) ??
    registration?.needsAccommodation ??
    ''
  ).toUpperCase();
  const needsAccommodation = ['YES', 'TRUE', '1', 'NEEDED'].includes(accommodationValue);

  const rawDate = String(
    getVal(mergedRecord, ['timestamp', 'createdAt', 'Date', 'date']) || registration?.createdAt || ''
  ).trim();

  return {
    ...registration,
    _raw: Object.keys(rawRecord).length > 0 ? rawRecord : toRecord(registration),
    id,
    name: getVal(mergedRecord, ['name']) || registration?.name || '—',
    email: getVal(mergedRecord, ['email']) || registration?.email || '—',
    phone: getVal(mergedRecord, ['phone']) || registration?.phone || '—',
    eventName: normalizeEventName(
      String(getVal(mergedRecord, ['event_name', 'eventName', 'Event Name', 'Event']) || registration?.eventName || '—')
    ),
    teamName: getVal(mergedRecord, ['team_name', 'teamName', 'Team Name', 'Team']) || registration?.teamName || '—',
    transactionId: getVal(mergedRecord, ['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || registration?.transactionId || '—',
    institution: getVal(mergedRecord, ['institution', 'college', 'College', 'Institution Name']) || registration?.institution || '—',
    category: getVal(mergedRecord, ['category', 'Category']) || registration?.category || '',
    participant2,
    participant3,
    participant4,
    participantCount,
    status,
    isAccepted,
    needsAccommodation,
    createdAt: rawDate ? parseRegistrationDate(rawDate).toISOString() : new Date().toISOString()
  };
}

function calculateStats(registrations: any[]) {
  const stats = { ...EMPTY_STATS };
  for (const reg of registrations) {
    stats.total++;
    if (reg.status === 'verified') stats.verified++;
    else if (reg.status === 'rejected') stats.rejected++;
    else stats.pending++;
  }
  return stats;
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
    let stats = { ...EMPTY_STATS };
    let useFallback = false;
    let liveFolders: ftp.FileInfo[] = [];

    // TRY LOADING FROM MASTER JSON FIRST
    try {
        const data = JSON.parse(await downloadTextFile(client, masterPath));
        registrations = (Array.isArray(data.registrations) ? data.registrations : [])
          .map((reg: any, idx: number) => normalizeRegistration(reg, `master_${idx}`))
          .filter((reg: any) => !!reg.id);
        stats = calculateStats(registrations);
    } catch (e) {
        useFallback = true;
    }

    try {
      liveFolders = await client.list(registrationsPath);
    } catch (e) {
      liveFolders = [];
    }

    const targetFolders = liveFolders.filter(f => f.isDirectory);

    if (!useFallback && targetFolders.length > 0) {
      const folderIds = new Set(targetFolders.map(folder => folder.name));
      const masterIds = new Set(registrations.map(reg => reg.id));
      useFallback =
        Array.from(folderIds).some(id => !masterIds.has(id)) ||
        Array.from(masterIds).some(id => !folderIds.has(id));
    }

    if (useFallback) {
        registrations = [];
        for (const folder of targetFolders) {
          const folderName = folder.name;
          const csvPath = `${registrationsPath}${folderName}/details.csv`;
          
          try {
            const csvContent = await downloadTextFile(client, csvPath);
            const record = parseCsvContent(csvContent);
            
            if (Object.keys(record).length === 0) continue;

            const reg = normalizeRegistration({ id: folderName, _raw: record, ...record }, folderName);
            if (!reg.id) continue;
            registrations.push(reg);
          } catch (e) { /* skip */ }
        }

        stats = calculateStats(registrations);

        try {
          const { Readable } = await import('stream');
          const masterPayload = JSON.stringify({
            lastUpdated: new Date().toISOString(),
            stats,
            registrations
          });
          await client.uploadFrom(Readable.from(masterPayload), masterPath);
        } catch (cacheError) {
          console.warn('Failed to refresh registrations master cache:', cacheError);
        }
    }

    // APPLY FILTERS
    let filteredRegs = registrations;
    if (search || statusFilter || eventFilter || categoryFilter || isAcceptedFilter !== 'all' || regFrom || regTo) {
        filteredRegs = registrations.filter(reg => {
            const searchString = `${reg.id} ${reg.name} ${reg.email} ${reg.teamName} ${reg.transactionId} ${reg.institution} ${reg.eventName}`.toLowerCase();
            
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

    const cleanedRegs = filteredRegs.map((reg: any) => ({
      id: reg.id,
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
      eventName: reg.eventName,
      teamName: reg.teamName,
      transactionId: reg.transactionId,
      institution: reg.institution,
      category: reg.category,
      participant2: reg.participant2,
      participant3: reg.participant3,
      participant4: reg.participant4,
      participantCount: reg.participantCount,
      status: reg.status,
      isAccepted: reg.isAccepted,
      needsAccommodation: reg.needsAccommodation,
      createdAt: reg.createdAt
    }));

    return NextResponse.json({ registrations: cleanedRegs, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.close();
  }
}
