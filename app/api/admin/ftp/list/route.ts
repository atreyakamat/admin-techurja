import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';

export async function GET(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : new URL(request.url).searchParams.get('token');

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/';

  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    const list = await client.list(path);
    client.close();

    return NextResponse.json({
      path,
      files: list.map(f => ({
        name: f.name,
        size: f.size,
        type: f.isDirectory ? 'dir' : 'file',
        modifiedAt: f.modifiedAt
      }))
    });
  } catch (error: any) {
    client.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
