import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Readable } from 'stream';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    const { action, adminNotes } = await request.json();
    const isApprove = action === 'approve';
    const newStatus = isApprove ? 'verified' : 'rejected';

    const csvPath = `/registrations/${id}/details.csv`;
    
    // Download the current CSV
    const chunks: Buffer[] = [];
    const { Writable } = await import('stream');
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });

    await client.downloadTo(writable, csvPath);
    const csvContent = Buffer.concat(chunks).toString('utf-8');

    // Parse the CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
       client.close();
       return NextResponse.json({ error: 'Record not found in CSV' }, { status: 404 });
    }

    const reg: any = records[0];
    reg.status = newStatus;
    reg.isAccepted = isApprove ? '1' : '0';
    reg.adminNotes = adminNotes || '';

    // Generate new CSV content
    const newCsvContent = stringify([reg], { header: true });

    // Upload the modified CSV
    const sourceStream = Readable.from(Buffer.from(newCsvContent, 'utf-8'));
    await client.uploadFrom(sourceStream, csvPath);

    client.close();

    return NextResponse.json({
      message: `Registration #${id} ${newStatus.toUpperCase()}.`,
      status: newStatus,
    });
  } catch (error: any) {
    client.close();
    console.error('Verify API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
