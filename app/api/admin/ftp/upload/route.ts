import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new ftp.Client();
  try {
    const formData = await request.formData();
    const path = formData.get('path') as string;
    const file = formData.get('file') as File;

    if (!path || !file) return NextResponse.json({ error: 'Missing path or file' }, { status: 400 });

    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sourceStream = Readable.from(buffer);

    const remotePath = `${path.endsWith('/') ? path : path + '/'}${file.name}`;
    await client.uploadFrom(sourceStream, remotePath);
    client.close();

    return NextResponse.json({ message: 'File uploaded', path: remotePath });
  } catch (error: any) {
    client.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
