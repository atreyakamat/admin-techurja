import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';

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

        const reg: any = { _raw: { ...record } };
        reg.id = folderName;
        reg.name = getVal(['name']) || '—';
        reg.email = getVal(['email']) || '—';
        reg.phone = getVal(['phone']) || '—';
        reg.eventName = getVal(['event_name', 'eventName', 'Event Name', 'Event']) || '—';
        reg.teamName = getVal(['team_name', 'teamName', 'Team Name', 'Team']) || '—';
        reg.transactionId = getVal(['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—';
        reg.institution = getVal(['institution', 'college', 'College', 'Institution Name']) || '—';
        
        const status = getVal(['status', 'Status']) || 'pending';
        reg.status = status.toLowerCase();
        reg.isAccepted = parseInt(getVal(['isAccepted', 'accepted']) || (reg.status === 'verified' ? '1' : '0'));
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
        // Skip
      }
    }

    registrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Load event details for fallback pricing
    const fs = await import('fs');
    const pathLib = await import('path');
    let eventPricing: Record<string, string> = {};
    try {
      const eventDetailsPath = pathLib.join(process.cwd(), 'event-details.csv');
      if (fs.existsSync(eventDetailsPath)) {
        const eventCsv = fs.readFileSync(eventDetailsPath, 'utf-8');
        const eventRecords = parse(eventCsv, { columns: true, skip_empty_lines: true });
        eventRecords.forEach((rec: any) => {
          if (rec['Event Name'] && rec['Registration Fees']) {
            eventPricing[rec['Event Name'].toLowerCase().trim()] = rec['Registration Fees'];
          }
        });
      }
    } catch (e) {
      console.error('Failed to load event pricing:', e);
    }

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    worksheet.columns = [
      { header: 'Sr No.', key: 'srNo', width: 10 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Transaction ID', key: 'utr', width: 25 },
      { header: 'Team Name/Individual name', key: 'name', width: 30 },
      { header: 'Full Amount', key: 'amount', width: 20 },
      { header: 'Event Name', key: 'event', width: 25 },
      { header: 'Image', key: 'image', width: 60 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    registrations.forEach((reg, index) => {
      const teamOrIndiv = reg.teamName && reg.teamName !== '—' ? reg.teamName : reg.name;
      const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/ftp/fetch?id=${reg.id}&token=${adminSecret}`;
      
      // Improved amount detection
      let amount = '—';
      const possibleAmountKeys = ['amount', 'Amount', 'fees', 'Fees', 'registration_fees', 'Registration Fees', 'paid_amount', 'Price'];
      for (const k of possibleAmountKeys) {
        const foundKey = Object.keys(reg._raw || {}).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
        if (foundKey && reg._raw[foundKey] && reg._raw[foundKey] !== 'N/A') {
          amount = reg._raw[foundKey];
          break;
        }
      }

      // Fallback to event-details.csv if still empty
      if (amount === '—' && reg.eventName) {
        const eventKey = reg.eventName.toLowerCase().trim();
        const feeConfig = eventPricing[eventKey];
        if (feeConfig) {
          if (feeConfig.includes(';')) {
            // Complex fee string like "15kgs:1180; 8kgs:944; 3lbs:590"
            // Try to find a match in the raw record for weight or category
            const subKeySearch = JSON.stringify(reg._raw || {}).toLowerCase();
            const tiers = feeConfig.split(';').map(t => t.trim());
            let matchedTier = '';
            for (const tier of tiers) {
              const label = tier.split(':')[0].toLowerCase().trim();
              if (label && subKeySearch.includes(label)) {
                matchedTier = tier.split(':')[1]?.trim() || tier;
                break;
              }
            }
            amount = matchedTier || feeConfig;
          } else {
            amount = feeConfig;
          }
        }
      }

      const row = worksheet.addRow({
        srNo: index + 1,
        date: new Date(reg.createdAt).toLocaleDateString('en-GB'),
        utr: reg.transactionId || '—',
        name: teamOrIndiv,
        amount: amount,
        event: reg.eventName,
        image: imageUrl
      });

      // Add clickable link to the image
      row.getCell('image').value = {
        text: 'View Receipt',
        hyperlink: imageUrl,
        tooltip: 'Click to open receipt image'
      };
      row.getCell('image').font = { color: { argb: 'FF0000FF' }, underline: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="registrations_${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.close();
  }
}