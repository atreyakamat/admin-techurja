import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';
import { getRegistrations } from '@/lib/registration-fetcher';

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
    
    const registrations = await getRegistrations(client);

    // Load event details for fallback pricing
    const fs = await import('fs');
    const pathLib = await import('path');
    let eventPricing: Record<string, string> = {};
    try {
      const eventDetailsPath = pathLib.join(process.cwd(), 'event-details.csv');
      if (fs.existsSync(eventDetailsPath)) {
        const eventCsv = fs.readFileSync(eventDetailsPath, 'utf-8');
        const eventRecords = parse(eventCsv, { 
          columns: true, 
          skip_empty_lines: true,
          relax_column_count: true,
          relax_quotes: true
        });
        eventRecords.forEach((rec: any) => {
          if (rec['Event Name'] && rec['Registration Fees']) {
            eventPricing[rec['Event Name'].toLowerCase().trim()] = rec['Registration Fees'];
          }
        });
      }
    } catch (e) {
      console.error('Failed to load event pricing:', e);
    }

    let filteredRegs = registrations;
    if (search || statusFilter || eventFilter || categoryFilter || isAcceptedFilter !== 'all' || regFrom || regTo) {
        filteredRegs = registrations.filter((reg: any) => {
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
              const regDate = new Date(reg.createdAt);
              const fromDate = new Date(regFrom);
              if (regDate < fromDate) return false;
            }
            if (regTo) {
              const regDate = new Date(reg.createdAt);
              const toDate = new Date(regTo);
              toDate.setHours(23, 59, 59, 999);
              if (regDate > toDate) return false;
            }
            return true;
        });
    }

    filteredRegs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Group registrations by event
    const groupedRegs: Record<string, any[]> = {};
    filteredRegs.forEach((reg: any) => {
      const eventName = reg.eventName || 'Uncategorized';
      if (!groupedRegs[eventName]) {
        groupedRegs[eventName] = [];
      }
      groupedRegs[eventName].push(reg);
    });

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    
    // Create Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Event Name', key: 'event', width: 30 },
      { header: 'Total Registrations', key: 'count', width: 20 }
    ];
    summarySheet.getRow(1).font = { bold: true };
    
    Object.keys(groupedRegs).sort().forEach(eventName => {
      summarySheet.addRow({
        event: eventName,
        count: groupedRegs[eventName].length
      });
    });

    // Create Event-wise Sheets
    Object.keys(groupedRegs).sort().forEach(eventName => {
      const safeSheetName = eventName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
      const worksheet = workbook.addWorksheet(safeSheetName);

      worksheet.columns = [
        { header: 'Sr No.', key: 'srNo', width: 8 },
        { header: 'Reg ID', key: 'id', width: 12 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Team Name', key: 'teamName', width: 25 },
        { header: 'Lead Name', key: 'leadName', width: 25 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Institution', key: 'institution', width: 30 },
        { header: 'Member 2', key: 'p2', width: 20 },
        { header: 'Member 3', key: 'p3', width: 20 },
        { header: 'Member 4', key: 'p4', width: 20 },
        { header: 'Transaction ID', key: 'utr', width: 20 },
        { header: 'Amount Paid', key: 'amount', width: 15 },
        { header: 'Accommodation', key: 'accom', width: 15 },
        { header: 'Status', key: 'status', width: 12 }
      ];

      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      groupedRegs[eventName].forEach((reg: any, index: number) => {
        // Improved amount detection - for now use fallback to event pricing
        let amount = '—';
        if (reg.eventName) {
          const eventKey = reg.eventName.toLowerCase().trim();
          const feeConfig = eventPricing[eventKey];
          if (feeConfig) {
            if (feeConfig.includes(';')) {
              const tiers = feeConfig.split(';').map(t => t.trim());
              amount = tiers[0].split(':')[1]?.trim() || feeConfig;
            } else {
              amount = feeConfig;
            }
          }
        }

        worksheet.addRow({
          srNo: index + 1,
          id: reg.id,
          date: new Date(reg.createdAt).toLocaleDateString('en-GB'),
          teamName: reg.teamName || '—',
          leadName: reg.name,
          email: reg.email,
          phone: reg.phone,
          institution: reg.institution || '—',
          p2: reg.participant2 || '—',
          p3: reg.participant3 || '—',
          p4: reg.participant4 || '—',
          utr: reg.transactionId || '—',
          amount: amount,
          accom: reg.needsAccommodation ? 'YES' : 'NO',
          status: (reg.status || 'pending').toUpperCase()
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="event_wise_registrations_${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.close();
  }
}