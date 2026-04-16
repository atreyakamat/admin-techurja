import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';

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
  const mode = searchParams.get('mode') || 'list';

  if (mode === 'pdf') {
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
      
      let folders: ftp.FileInfo[] = [];
      try {
          folders = await client.list(registrationsPath);
      } catch(e) {
          folders = [];
      }

      const targetFolders = folders.filter(f => f.isDirectory);
      const registrations: any[] = [];
      
      const { parse } = await import('csv-parse/sync');

      // Filtering criteria from query params
      const search = searchParams.get('search')?.toLowerCase() || '';
      const statusFilter = searchParams.get('status') || '';
      const eventFilter = searchParams.get('event')?.toLowerCase() || '';
      const regFrom = searchParams.get('reg_from') || '';
      const regTo = searchParams.get('reg_to') || '';

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
          
          const records = parse(csvContent, { skip_empty_lines: true, trim: true, relax_quotes: true });
          const record: Record<string, string> = {};
          
          if (records.length > 0 && records.every((r: any) => r.length === 2)) {
            for (const row of records) {
              record[row[0]] = row[1] || '';
            }
          } else if (records.length >= 2) {
            const headers = records[0];
            const data = records[1];
            headers.forEach((h: string, i: number) => {
              record[h] = data[i] || '';
            });
          }

          if (Object.keys(record).length === 0) continue;

          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const foundKey = Object.keys(record).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
              if (foundKey !== undefined) return record[foundKey];
            }
            return undefined;
          };

          const reg: any = {
            id: folderName,
            name: getVal(['name']) || '—',
            email: getVal(['email']) || '—',
            phone: getVal(['phone']) || '—',
            eventName: getVal(['event_name', 'eventName', 'Event Name', 'Event']) || '—',
            teamName: getVal(['team_name', 'teamName', 'Team Name', 'Team']) || '—',
            transactionId: getVal(['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—',
            institution: getVal(['institution', 'college', 'College', 'Institution Name']) || '—',
            status: (getVal(['status', 'Status']) || 'pending').toLowerCase(),
            createdAt: getVal(['timestamp', 'createdAt', 'Date', 'date']) || new Date().toISOString()
          };

          const searchString = `${reg.id} ${reg.name} ${reg.email} ${reg.teamName} ${reg.transactionId} ${reg.institution} ${reg.eventName}`.toLowerCase();
          let match = true;
          
          if (search && !searchString.includes(search)) match = false;
          if (statusFilter && reg.status !== statusFilter) match = false;
          if (eventFilter && !reg.eventName.toLowerCase().includes(eventFilter)) match = false;
          if (regFrom && new Date(reg.createdAt) < new Date(regFrom)) match = false;
          if (regTo) {
             const toDate = new Date(regTo);
             toDate.setHours(23,59,59,999);
             if (new Date(reg.createdAt) > toDate) match = false;
          }
          
          if (match) registrations.push(reg);
        } catch (e) { }
      }

      registrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Generate PDF
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]); // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const { width, height } = page.getSize();
      let y = height - 50;

      // Header
      page.drawText('TECHURJA 2026 - REGISTRATION REPORT', { x: 50, y, size: 16, font: boldFont, color: rgb(0, 0, 0) });
      y -= 25;
      page.drawText(`Generated on: ${new Date().toLocaleString()}`, { x: 50, y, size: 10, font });
      y -= 15;
      page.drawText(`Filter: ${eventFilter ? 'Event: ' + eventFilter.toUpperCase() : 'ALL EVENTS'} | Status: ${statusFilter ? statusFilter.toUpperCase() : 'ALL'}`, { x: 50, y, size: 10, font });
      y -= 30;

      // Table Header
      const colX = [50, 100, 220, 340, 460, 520];
      const headers = ['ID', 'TEAM / LEAD', 'EVENT', 'COLLEGE / INST.', 'UTR', 'STATUS'];
      
      page.drawRectangle({ x: 45, y: y - 5, width: width - 90, height: 20, color: rgb(0.9, 0.9, 0.9) });
      headers.forEach((h, i) => {
        page.drawText(h, { x: colX[i], y, size: 9, font: boldFont });
      });
      y -= 25;

      // Rows
      for (const reg of registrations) {
        if (y < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - 50;
          page.drawRectangle({ x: 45, y: y - 5, width: width - 90, height: 20, color: rgb(0.9, 0.9, 0.9) });
          headers.forEach((h, i) => {
            page.drawText(h, { x: colX[i], y, size: 9, font: boldFont });
          });
          y -= 25;
        }

        page.drawText(`#${reg.id}`, { x: colX[0], y, size: 8, font });
        
        const leadText = reg.teamName !== '—' ? `${reg.teamName}\n(${reg.name})` : reg.name;
        page.drawText(leadText.substring(0, 40), { x: colX[1], y, size: 8, font });
        
        page.drawText(reg.eventName.substring(0, 30), { x: colX[2], y, size: 8, font });
        page.drawText(reg.institution.substring(0, 30), { x: colX[3], y, size: 8, font });
        page.drawText(reg.transactionId.substring(0, 20), { x: colX[4], y, size: 8, font });
        
        const statusColor = reg.status === 'verified' ? rgb(0, 0.5, 0) : reg.status === 'rejected' ? rgb(0.8, 0, 0) : rgb(0.5, 0.5, 0);
        page.drawText(reg.status.toUpperCase(), { x: colX[5], y, size: 8, font: boldFont, color: statusColor });

        y -= 25;
      }

      const pdfBytes = await pdfDoc.save();
      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="registrations_${eventFilter || 'all'}.pdf"`
        }
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      client.close();
    }
  }

  if (mode === 'custom-pdf') {
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
      
      let folders: ftp.FileInfo[] = [];
      try { folders = await client.list(registrationsPath); } catch(e) { folders = []; }

      const targetFolders = folders.filter(f => f.isDirectory);
      const registrations: any[] = [];
      const { parse } = await import('csv-parse/sync');

      const selectedFields = searchParams.get('fields')?.split(',') || [];
      const eventFilter = searchParams.get('event')?.toLowerCase() || '';
      const statusFilter = searchParams.get('status') || '';

      for (const folder of targetFolders) {
        const folderName = folder.name;
        try {
          const csvPath = `${registrationsPath}${folderName}/details.csv`;
          const chunks: Buffer[] = [];
          const { Writable } = await import('stream');
          const writable = new Writable({ write(chunk, enc, cb) { chunks.push(chunk); cb(); } });
          await client.downloadTo(writable, csvPath);
          const buffer = Buffer.concat(chunks);
          const records = parse(buffer.toString('utf-8'), { skip_empty_lines: true, trim: true, relax_quotes: true });
          const record: Record<string, string> = {};
          
          if (records.length > 0 && records.every((r: any) => r.length === 2)) {
            for (const row of records) record[row[0]] = row[1] || '';
          } else if (records.length >= 2) {
            const headers = records[0]; const data = records[1];
            headers.forEach((h: string, i: number) => { record[h] = data[i] || ''; });
          }

          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const foundKey = Object.keys(record).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
              if (foundKey !== undefined) return record[foundKey];
            }
            return undefined;
          };

          const reg: any = {
            id: folderName,
            name: getVal(['name']) || '—',
            email: getVal(['email']) || '—',
            phone: getVal(['phone']) || '—',
            eventName: getVal(['event_name', 'eventName', 'Event Name', 'Event']) || '—',
            teamName: getVal(['team_name', 'teamName', 'Team Name', 'Team']) || '—',
            transactionId: getVal(['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—',
            institution: getVal(['institution', 'college', 'College', 'Institution Name']) || '—',
            status: (getVal(['status', 'Status']) || 'pending').toLowerCase(),
            createdAt: getVal(['timestamp', 'createdAt', 'Date', 'date']) || new Date().toISOString(),
            participantCount: 1,
            needsAccommodation: ['YES', 'TRUE', '1', 'NEEDED'].includes(String(getVal(['needs_accommodation', 'needsAccommodation']) || '').toUpperCase()) ? 'YES' : 'NO'
          };

          for (let i = 2; i <= 4; i++) {
            const pName = getVal([`participant${i}`, `Participant ${i} Name`]);
            reg[`participant${i}`] = pName || '—';
            if (pName && pName !== '—') reg.participantCount++;
          }

          let match = true;
          if (statusFilter && reg.status !== statusFilter) match = false;
          if (eventFilter && !reg.eventName.toLowerCase().includes(eventFilter)) match = false;
          
          if (match) registrations.push(reg);
        } catch (e) {}
      }

      registrations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([841.89, 595.28]); // Landscape A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const { width, height } = page.getSize();
      
      let y = height - 50;
      page.drawText('TECHURJA 2026 - CUSTOM REGISTRATION REPORT', { x: 50, y, size: 16, font: boldFont });
      y -= 25;
      page.drawText(`Event: ${eventFilter.toUpperCase() || 'ALL'} | Generated: ${new Date().toLocaleString()}`, { x: 50, y, size: 10, font });
      y -= 30;

      const fieldLabels: Record<string, string> = {
        id: 'ID', teamName: 'Team', name: 'Lead', phone: 'Phone', email: 'Email',
        institution: 'College', eventName: 'Event', status: 'Status',
        participantCount: 'Count', participant2: 'P2', participant3: 'P3', participant4: 'P4',
        transactionId: 'UTR', needsAccommodation: 'Accom.', createdAt: 'Date'
      };

      const tableHeaders = selectedFields.map(f => fieldLabels[f] || f);
      const colWidth = (width - 100) / tableHeaders.length;
      
      page.drawRectangle({ x: 45, y: y - 5, width: width - 90, height: 20, color: rgb(0.9, 0.9, 0.9) });
      tableHeaders.forEach((h, i) => {
        page.drawText(h, { x: 50 + (i * colWidth), y, size: 8, font: boldFont });
      });
      y -= 20;

      for (const reg of registrations) {
        if (y < 40) break; // Simplified for now, one page for custom report or add pagination
        selectedFields.forEach((f, i) => {
          const val = String(reg[f] || '—').substring(0, Math.floor(colWidth/6));
          page.drawText(val, { x: 50 + (i * colWidth), y, size: 7, font });
        });
        y -= 15;
      }

      const pdfBytes = await pdfDoc.save();
      return new NextResponse(pdfBytes, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="custom_report.pdf"` }
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      client.close();
    }
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'list';

  if (mode === 'daily-stats') {
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
      } catch (e) {
        folders = [];
      }

      const targetFolders = folders.filter(f => f.isDirectory);
      const dailyCounts: Record<string, number> = {};

      // We need to peek into each details.csv to get the date.
      // This is slow, but consistent with how the app currently works.
      const { parse } = await import('csv-parse/sync');

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

          const records = parse(csvContent, { skip_empty_lines: true, trim: true, relax_quotes: true });
          let createdAt = '';

          // Find timestamp/date field
          for (const row of records) {
            const key = row[0]?.toLowerCase();
            if (['timestamp', 'createdat', 'date'].includes(key)) {
              createdAt = row[1];
              break;
            }
          }

          if (!createdAt) createdAt = new Date().toISOString();
          const dateStr = new Date(createdAt).toISOString().split('T')[0];
          dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        } catch (e) {
          // Skip if file missing or parse error
        }
      }
      
      const sortedStats = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.date.localeCompare(a.date));

      return NextResponse.json({ dailyStats: sortedStats });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      client.close();
    }
  }

  const path = searchParams.get('path') || '/reports';

  let client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });
    const files = await client.list(path);

    return NextResponse.json({
      path,
      files: files.map(f => ({
        name: f.name,
        type: f.isDirectory ? 'dir' : 'file',
        size: f.size,
        modifiedAt: f.modifiedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.close();
  }
}
