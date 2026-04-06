import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as ftp from 'basic-ftp';

export async function GET(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let dbStatus = false;
  let ftpStatus = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = true;
  } catch (e) {
    console.error('DB Status Check Failed:', e);
  }

  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });
    ftpStatus = true;
    client.close();
  } catch (e) {
    console.error('FTP Status Check Failed:', e);
  }

  return NextResponse.json({
    database: dbStatus,
    ftp: ftpStatus,
  });
}
