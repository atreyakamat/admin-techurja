import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new ftp.Client();
  try {
    const { path, type } = await request.json();
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    if (type === 'dir') {
        await client.removeDir(path);
    } else {
        await client.remove(path);
    }
    client.close();

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    client.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
