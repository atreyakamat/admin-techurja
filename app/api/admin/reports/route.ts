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
  const path = searchParams.get('path') || '/reports';

  let client;
  try {
    client = await getFtpClient();
    const files = await client.list(path);
    client.close();

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
    if (client) client.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
