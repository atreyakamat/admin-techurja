import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import nodemailer from 'nodemailer';
import { PDFDocument, rgb } from 'pdf-lib';
import { Readable } from 'stream';

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
  // Simple authorization for the cron job
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const toEmail = searchParams.get('to') || process.env.ADMIN_EMAIL || 'admin@techurja.com';

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
    
    // Calculate timeframe: 3:00 PM yesterday to 3:00 PM today
    const now = new Date();
    const today3PM = new Date(now);
    today3PM.setHours(15, 0, 0, 0); // 3 PM today
    
    let yesterday3PM = new Date(now);
    yesterday3PM.setDate(yesterday3PM.getDate() - 1);
    yesterday3PM.setHours(15, 0, 0, 0); // 3 PM yesterday

    // If it's currently before 3 PM, shift the window back by one day
    if (now < today3PM) {
      today3PM.setDate(today3PM.getDate() - 1);
      yesterday3PM.setDate(yesterday3PM.getDate() - 1);
    }

    for (const folder of targetFolders) {
      const folderName = folder.name;
      const csvPath = `${registrationsPath}${folderName}/details.csv`;
      
      try {
        const chunks: Buffer[] = [];
        const writable = new (require('stream').Writable)({
          write(chunk: any, encoding: any, callback: any) {
            chunks.push(chunk);
            callback();
          }
        });

        await client.downloadTo(writable, csvPath);
        const buffer = Buffer.concat(chunks);
        const csvContent = buffer.toString('utf-8');
        
        const records = parse(csvContent, { columns: false, skip_empty_lines: true, trim: true });
        
        if (records.length > 0) {
           let record: any = {};
           const isKeyValue = records.every((r: any) => r.length === 2);
           if (isKeyValue) {
               records.forEach((r: any) => { record[r[0]] = r[1]; });
           } else {
               const headers = records[0];
               const data = records[1] || [];
               headers.forEach((h: string, i: number) => { record[h] = data[i]; });
           }

           const getVal = (keys: string[]) => {
             const recordKeys = Object.keys(record);
             for (const k of keys) {
               const foundKey = recordKeys.find(rk => rk.trim().toLowerCase() === k.toLowerCase());
               if (foundKey !== undefined) {
                 const val = record[foundKey];
                 return (val && val.toUpperCase() !== 'N/A') ? val : undefined;
               }
             }
             return undefined;
           };

           const createdAtRaw = getVal(['timestamp', 'createdAt', 'Date', 'date']);
           const createdAtDate = new Date(createdAtRaw || 0);

           // Filter for the 24-hour window
           if (createdAtDate >= yesterday3PM && createdAtDate <= today3PM) {
               const reg: any = {};
               reg.id = getVal(['id', 'ID']) || folderName;
               reg.name = getVal(['name', 'Lead Name', 'Full Name', 'Participant 1 Name']) || '—';
               reg.email = getVal(['email', 'Email', 'Lead Email']) || '—';
               reg.eventName = getVal(['event_name', 'eventName', 'Event Name', 'Event']) || '—';
               reg.teamName = getVal(['team_name', 'teamName', 'Team Name', 'Team']) || '—';
               reg.transactionId = getVal(['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—';
               reg.institution = getVal(['institution', 'college', 'College', 'Institution Name']) || '—';
               reg.date = createdAtDate.toLocaleString();
               
               // Try to find image
               let imgBuffer = null;
               try {
                   const possiblePaths = [`/registrations/${folderName}/`, `/registrations/${folderName}/image/`];
                   let finalPath = "";
                   for (const p of possiblePaths) {
                        try {
                            const files = await client.list(p);
                            const imgFile = files.find(f => /\.(png|jpg|jpeg)$/i.test(f.name) && !f.isDirectory);
                            if (imgFile) {
                                finalPath = p + imgFile.name;
                                break;
                            }
                        } catch (e) {}
                   }
                   if (finalPath) {
                       reg.proofPath = finalPath;
                       const imgChunks: Buffer[] = [];
                       const imgWritable = new (require('stream').Writable)({
                         write(chunk: any, enc: any, cb: any) { imgChunks.push(chunk); cb(); }
                       });
                       await client.downloadTo(imgWritable, finalPath);
                       imgBuffer = Buffer.concat(imgChunks);
                   }
               } catch(e) {}
               
               reg.imgBuffer = imgBuffer;
               registrations.push(reg);
           }
        }
      } catch (e) {}
    }

    client.close();

    // 2. Create the PDF
    const pdfDoc = await PDFDocument.create();
    
    // Load Poster for Logo
    let logoImg;
    try {
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(process.cwd(), 'public', 'TechUrja2026-Poster.png');
        const logoBytes = fs.readFileSync(logoPath);
        logoImg = await pdfDoc.embedPng(logoBytes);
    } catch(e) {
        console.error('Failed to load logo for PDF', e);
    }

    // Title Page
    let page = pdfDoc.addPage([600, 800]);
    
    if (logoImg) {
        const logoDims = logoImg.scaleToFit(150, 150);
        page.drawImage(logoImg, {
            x: 50,
            y: 650,
            width: logoDims.width,
            height: logoDims.height,
        });
    }

    page.drawText(`Techurja Daily Registration Report`, { x: 50, y: 620, size: 24, color: rgb(0, 0, 0) });
    page.drawText(`From: ${yesterday3PM.toLocaleString()}`, { x: 50, y: 590, size: 12 });
    page.drawText(`To: ${today3PM.toLocaleString()}`, { x: 50, y: 570, size: 12 });
    page.drawText(`Total Registrations in Period: ${registrations.length}`, { x: 50, y: 540, size: 14 });

    for (const reg of registrations) {
        page = pdfDoc.addPage([600, 800]);
        let y = 750;
        
        page.drawText(`Registration ID: ${reg.id}`, { x: 50, y, size: 16 }); y -= 30;
        page.drawText(`Date: ${reg.date}`, { x: 50, y, size: 12 }); y -= 20;
        page.drawText(`Event: ${reg.eventName}`, { x: 50, y, size: 12 }); y -= 20;
        page.drawText(`Team: ${reg.teamName}`, { x: 50, y, size: 12 }); y -= 20;
        page.drawText(`College: ${reg.institution}`, { x: 50, y, size: 12 }); y -= 20;
        page.drawText(`Lead Name: ${reg.name} (${reg.email})`, { x: 50, y, size: 12 }); y -= 20;
        page.drawText(`Transaction ID (UTR): ${reg.transactionId}`, { x: 50, y, size: 12 }); y -= 40;

        if (reg.imgBuffer) {
            try {
                let img;
                // Attempt to embed based on magic bytes (rough heuristic) or try/catch both
                try {
                    img = await pdfDoc.embedJpg(reg.imgBuffer);
                } catch(e) {
                    img = await pdfDoc.embedPng(reg.imgBuffer);
                }
                
                const dims = img.scaleToFit(500, 400);
                page.drawImage(img, {
                    x: 50,
                    y: y - dims.height,
                    width: dims.width,
                    height: dims.height,
                });
            } catch (e) {
                page.drawText(`[Image attached but format unsupported for PDF: only JPG/PNG allowed]`, { x: 50, y, size: 10, color: rgb(1,0,0) });
            }
        } else {
            page.drawText(`[No payment screenshot found on FTP]`, { x: 50, y, size: 10, color: rgb(1,0,0) });
        }
    }

    const pdfBytes = await pdfDoc.save();

    // 2.2 Create the CSV report
    const { stringify } = await import('csv-stringify/sync');
    const csvRows = registrations.map((reg, index) => [
        index + 1,
        reg.teamName || '—',
        reg.name || '—',
        reg.transactionId || '—',
        reg.date || '—',
        reg.proofPath || 'No proof found'
    ]);
    const csvHeaders = ['Sr.no', 'Team name', 'Full name of payee', 'Transaction ID', 'Date of Transaction', 'Proof of traction'];
    const csvContent = stringify(csvRows, { header: true, columns: csvHeaders });

    // 2.5 Save Reports to FTP for archival
    try {
        client = await getFtpClient();
        const dateStr = new Date().toISOString().slice(0, 10);
        const reportDir = `/reports/${dateStr}`;
        await client.ensureDir(reportDir);
        
        const timestamp = new Date().getTime();
        const pdfFileName = `Report_3PM_${timestamp}.pdf`;
        const csvFileName = `Report_3PM_${timestamp}.csv`;

        const pdfStream = Readable.from(Buffer.from(pdfBytes));
        await client.uploadFrom(pdfStream, `${reportDir}/${pdfFileName}`);
        
        const csvStream = Readable.from(Buffer.from(csvContent));
        await client.uploadFrom(csvStream, `${reportDir}/${csvFileName}`);

        console.log(`[ARCHIVE_SUCCESS]: Reports saved to FTP at ${reportDir}`);
        client.close();
    } catch (archiveErr) {
        console.error('[ARCHIVE_ERROR]: Failed to save reports to FTP', archiveErr);
        if (client) client.close();
    }

    // 3. Send Email
    // Note: Configure SMTP credentials in your Netlify/Vercel Environment Variables
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: `"Techurja Admin" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Techurja Daily Registrations Report - ${new Date().toLocaleDateString()}`,
        text: `Attached is the daily report for all registrations received between ${yesterday3PM.toLocaleString()} and ${today3PM.toLocaleString()}.\n\nTotal New Registrations: ${registrations.length}\n\nThis is an automated email from the Techurja Admin System.`,
        attachments: [
            {
                filename: `Techurja_Registrations_${new Date().toISOString().slice(0,10)}.pdf`,
                content: Buffer.from(pdfBytes),
                contentType: 'application/pdf'
            }
        ]
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
        return NextResponse.json({ message: `Report sent successfully to ${toEmail} with ${registrations.length} records.` });
    } else {
        return NextResponse.json({ 
            message: `PDF generated with ${registrations.length} records, but email not sent because SMTP credentials (SMTP_USER, SMTP_PASS) are missing in environment variables.`,
            note: "To trigger this daily, set up a cron job (e.g., cron-job.org or Vercel Cron) to hit: GET /api/cron/daily-report?token=YOUR_ADMIN_SECRET"
        });
    }

  } catch (error: any) {
    if (client) client.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
