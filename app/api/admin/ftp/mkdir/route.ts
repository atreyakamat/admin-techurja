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
    const { path, name } = await request.json();
    if (!path || !name) return NextResponse.json({ error: 'Missing path or name' }, { status: 400 });

    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    const newPath = `${path.endsWith('/') ? path : path + '/'}${name}`;
    await client.ensureDir(newPath);
    client.close();

    return NextResponse.json({ message: 'Directory created', path: newPath });
  } catch (error: any) {
    client.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
