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

    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
       client.close();
       return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const isKeyValue = records.every((r: any) => r.length === 2);
    let newCsvContent = "";

    if (isKeyValue) {
        // Update the key-value pairs
        let foundStatus = false;
        let foundAccepted = false;
        let foundNotes = false;

        const updated = records.map((r: any) => {
            const key = r[0].trim().toLowerCase();
            if (key === 'status') { foundStatus = true; return ['status', newStatus]; }
            if (key === 'isaccepted' || key === 'accepted') { foundAccepted = true; return [r[0], isApprove ? '1' : '0']; }
            if (key === 'adminnotes' || key === 'admin_notes') { foundNotes = true; return [r[0], adminNotes || '']; }
            return r;
        });

        if (!foundStatus) updated.push(['status', newStatus]);
        if (!foundAccepted) updated.push(['isAccepted', isApprove ? '1' : '0']);
        if (!foundNotes) updated.push(['adminNotes', adminNotes || '']);

        newCsvContent = stringify(updated);
    } else {
        // Update tabular format
        const headers = records[0];
        const data = records[1] || [];
        const record: any = {};
        headers.forEach((h: string, i: number) => { record[h] = data[i]; });

        record.status = newStatus;
        record.isAccepted = isApprove ? '1' : '0';
        record.adminNotes = adminNotes || '';

        newCsvContent = stringify([record], { header: true });
    }

    const sourceStream = Readable.from(Buffer.from(newCsvContent, 'utf-8'));
    await client.uploadFrom(sourceStream, csvPath);

    client.close();

    return NextResponse.json({
      message: `Registration #${id} ${newStatus.toUpperCase()}.`,
      status: newStatus,
    });
  } catch (error: any) {
    client.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
