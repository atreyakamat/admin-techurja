import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import nodemailer from 'nodemailer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Readable, Writable } from 'stream';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';

// Utility to get the FTP client
async function getFtpClient() {
  const client = new ftp.Client();
  client.ftp.verbose = false;
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
  try {
    const records = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });
    if (records.length === 0) return {};
    
    // Check if it's Key-Value format (2 columns per row)
    const isKeyValue = records.every((r: any) => r.length === 2);
    if (isKeyValue) {
      const result: Record<string, string> = {};
      for (const row of records) {
        result[row[0]] = row[1] || '';
      }
      return result;
    }

    // Check if it's Table format (Header row + Data row)
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
    console.error('[CSV_PARSE_ERROR]:', e);
  }
  return {};
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const force = searchParams.get('force') === 'true'; 
  const limit = parseInt(searchParams.get('limit') || '50'); // Prevent OOM errors
  
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const toEmail = searchParams.get('to') || process.env.ADMIN_EMAIL || 'admin@techurja.com';

  let client;
  try {
    console.log('[REPORT_START]: Initiating report generation sequence...');
    client = await getFtpClient();
    const registrationsPath = '/registrations/';
    
    let folders: ftp.FileInfo[] = [];
    try {
        folders = await client.list(registrationsPath);
    } catch(e) {
        throw new Error('Could not list /registrations directory on FTP.');
    }

    const targetFolders = folders.filter(f => f.isDirectory).reverse(); // Newest first
    const registrations: any[] = [];
    
    const now = new Date();
    const today3PM = new Date(now);
    today3PM.setHours(15, 0, 0, 0);
    
    let yesterday3PM = new Date(now);
    yesterday3PM.setDate(yesterday3PM.getDate() - 1);
    yesterday3PM.setHours(15, 0, 0, 0);

    if (now < today3PM) {
      today3PM.setDate(today3PM.getDate() - 1);
      yesterday3PM.setDate(yesterday3PM.getDate() - 1);
    }

    console.log(`[REPORT_WINDOW]: ${yesterday3PM.toISOString()} to ${today3PM.toISOString()}`);

    for (const folder of targetFolders) {
      if (registrations.length >= limit) break;
      
      const folderName = folder.name;
      const csvPath = `${registrationsPath}${folderName}/details.csv`;
      
      try {
        const chunks: Buffer[] = [];
        const writable = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
          }
        });

        await client.downloadTo(writable, csvPath);
        const csvContent = Buffer.concat(chunks).toString('utf-8');
        const record = parseCsvContent(csvContent);
        
        if (Object.keys(record).length === 0) continue;

        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const foundKey = Object.keys(record).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
            if (foundKey !== undefined) {
              const val = record[foundKey];
              return (val && val.toUpperCase() !== 'N/A') ? val : undefined;
            }
          }
          return undefined;
        };

        const createdAtRaw = getVal(['timestamp', 'createdAt', 'Date', 'date']);
        const createdAtDate = new Date(createdAtRaw || 0);

        if (force || (createdAtDate >= yesterday3PM && createdAtDate <= today3PM)) {
            const reg: any = { id: folderName };
            reg.name = getVal(['name', 'Lead Name', 'Full Name', 'Participant 1 Name']) || '—';
            reg.email = getVal(['email', 'Email', 'Lead Email']) || '—';
            reg.phone = getVal(['phone', 'Phone', 'Lead Phone']) || '—';
            reg.eventName = getVal(['event_name', 'eventName', 'Event Name', 'Event']) || '—';
            reg.teamName = getVal(['team_name', 'teamName', 'Team Name', 'Team']) || '—';
            reg.transactionId = getVal(['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—';
            reg.institution = getVal(['institution', 'college', 'College', 'Institution Name']) || '—';
            reg.date = createdAtDate.toLocaleString();
            reg.createdAt = createdAtDate.toISOString();
            reg.needsAccommodation = ['YES', 'TRUE', '1', 'NEEDED'].includes(String(getVal(['needs_accommodation', 'needsAccommodation', 'Accommodation']) || '').toUpperCase()) ? 'YES' : 'NO';

            reg.participants = [];
            for (let i = 2; i <= 4; i++) {
                const pName = getVal([`participant${i}`, `Participant ${i} Name`]);
                if (pName) {
                    reg.participants.push({
                        name: pName,
                        email: getVal([`email${i}`, `Participant ${i} Email`]) || '—',
                        phone: getVal([`phone${i}`, `Participant ${i} Phone`]) || '—'
                    });
                }
            }
            
            // Image handling
            let imgBuffer = null;
            try {
                const possiblePaths = [`/registrations/${folderName}/`, `/registrations/${folderName}/image/`];
                let finalPath = "";
                for (const p of possiblePaths) {
                    const files = await client.list(p);
                    const imgFile = files.find(f => /\.(png|jpg|jpeg)$/i.test(f.name) && !f.isDirectory);
                    if (imgFile) {
                        finalPath = p + imgFile.name;
                        break;
                    }
                }
                if (finalPath) {
                    reg.proofPath = finalPath;
                    const imgChunks: Buffer[] = [];
                    const imgWritable = new Writable({ write(chunk, enc, cb) { imgChunks.push(chunk); cb(); } });
                    await client.downloadTo(imgWritable, finalPath);
                    imgBuffer = Buffer.concat(imgChunks);
                }
            } catch(e) {
                console.warn(`[IMAGE_SKIP]: ${folderName} - No image or download failed`);
            }
            
            reg.imgBuffer = imgBuffer;
            registrations.push(reg);
        }
      } catch (e) {
          console.error(`[REG_SKIP]: Error processing ${folderName}:`, e);
      }
    }

    client.close();

    if (registrations.length === 0) {
        return NextResponse.json({ message: 'No new registrations found for this period.', count: 0 });
    }

    // 2. Generate PDF
    const pdfDoc = await PDFDocument.create();
    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let logoImg;
    try {
        const logoPath = path.join(process.cwd(), 'public', 'TechUrja2026-Poster.png');
        if (fs.existsSync(logoPath)) {
            logoImg = await pdfDoc.embedPng(fs.readFileSync(logoPath));
        }
    } catch(e) { console.error('Logo Error:', e); }

    // Title Page
    let page = pdfDoc.addPage([600, 800]);
    if (logoImg) {
        const logoDims = logoImg.scaleToFit(120, 120);
        page.drawImage(logoImg, { x: 50, y: 660, width: logoDims.width, height: logoDims.height });
    }
    page.drawText(`TechUrja 2026: Registration Report`, { x: 50, y: 620, size: 22, font: boldFont });
    page.drawText(`Generation Date: ${new Date().toLocaleString()}`, { x: 50, y: 595, size: 10, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Period: ${force ? "Full Data Dump" : yesterday3PM.toLocaleString() + ' to ' + today3PM.toLocaleString()}`, { x: 50, y: 575, size: 11 });
    page.drawText(`Total Records in this PDF: ${registrations.length}`, { x: 50, y: 550, size: 14, font: boldFont, color: rgb(0, 0.5, 0.7) });

    // Registration Details
    for (const reg of registrations) {
        page = pdfDoc.addPage([600, 800]);
        let y = 750;
        page.drawText(`Registration #${reg.id}`, { x: 50, y, size: 18, font: boldFont }); y -= 35;
        
        const row = (label: string, val: string) => {
            page.drawText(label + ":", { x: 50, y, size: 11, font: boldFont });
            page.drawText(String(val), { x: 170, y, size: 11, font: standardFont });
            y -= 20;
        };

        row('Event', reg.eventName);
        row('Team Name', reg.teamName);
        row('Institution', reg.institution);
        row('Transaction ID', reg.transactionId);
        row('Timestamp', reg.date);
        row('Accommodation', reg.needsAccommodation);
        y -= 10;
        
        page.drawText('Contact Details (Lead):', { x: 50, y, size: 12, font: boldFont }); y -= 18;
        page.drawText(`${reg.name} | ${reg.email} | ${reg.phone}`, { x: 50, y, size: 10 }); y -= 25;

        if (reg.participants.length > 0) {
            page.drawText('Other Team Members:', { x: 50, y, size: 11, font: boldFont }); y -= 18;
            for (const p of reg.participants) {
                page.drawText(`• ${p.name} (${p.email})`, { x: 60, y, size: 10 }); y -= 15;
            }
            y -= 10;
        }

        if (reg.imgBuffer) {
            try {
                let img;
                try { img = await pdfDoc.embedJpg(reg.imgBuffer); } 
                catch(e) { img = await pdfDoc.embedPng(reg.imgBuffer); }
                
                const dims = img.scaleToFit(500, 350);
                if (y - dims.height < 50) { 
                    page = pdfDoc.addPage([600, 800]); y = 750; 
                    page.drawText(`Payment Proof for #${reg.id}:`, { x: 50, y, size: 12, font: boldFont }); y -= 30;
                }
                page.drawImage(img, { x: 50, y: y - dims.height, width: dims.width, height: dims.height });
            } catch(e) {
                page.drawText('[Image Format Unsupported or Corrupt]', { x: 50, y, color: rgb(0.8, 0, 0), size: 10 });
            }
        } else {
            page.drawText('[No Payment Screenshot Found]', { x: 50, y, color: rgb(0.5, 0.5, 0.5), size: 10 });
        }
        page.drawText(`TechUrja 2026 Admin System`, { x: 50, y: 30, size: 8, color: rgb(0.6, 0.6, 0.6) });
    }

    const pdfBytes = await pdfDoc.save();

    // 3. Generate CSV
    const csvContent = stringify(registrations.map(r => [
        r.id, r.eventName, r.teamName, r.name, r.email, r.phone, r.transactionId, r.institution, r.date
    ]), {
        header: true,
        columns: ['ID', 'Event', 'Team', 'Lead Name', 'Email', 'Phone', 'UTR', 'College', 'Date']
    });

    const ts = Date.now();
    // 4. Archive to FTP
    try {
        client = await getFtpClient();
        const reportDir = `/reports/${new Date().toISOString().slice(0, 10)}`;
        await client.ensureDir(reportDir);
        await client.uploadFrom(Readable.from(Buffer.from(pdfBytes)), `${reportDir}/Report_${ts}.pdf`);
        await client.uploadFrom(Readable.from(Buffer.from(csvContent)), `${reportDir}/Data_${ts}.csv`);
        client.close();
    } catch(e) { console.error('Archive Error:', e); }

    // 5. Send Email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        await transporter.sendMail({
            from: `"TechUrja Admin" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: `TechUrja Registration Report - ${new Date().toLocaleDateString()}`,
            text: `Daily Report Summary:\nTotal New Registrations: ${registrations.length}\n\nPDF and CSV data files are attached.`,
            attachments: [
                { filename: `TechUrja_Report_${ts}.pdf`, content: Buffer.from(pdfBytes) },
                { filename: `TechUrja_Data_${ts}.csv`, content: Buffer.from(csvContent) }
            ]
        });

        return NextResponse.json({ success: true, message: `Report sent to ${toEmail} with ${registrations.length} records.` });
    }

    return NextResponse.json({ 
        success: true, 
        message: `Report generated (${registrations.length} records) and archived to FTP. SMTP not configured for email delivery.` 
    });

  } catch (error: any) {
    if (client) client.close();
    console.error('[CRON_FATAL_ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
