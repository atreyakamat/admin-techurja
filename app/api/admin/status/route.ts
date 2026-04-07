import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as ftp from 'basic-ftp';

export async function GET(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : new URL(request.url).searchParams.get('token');

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
    console.log(`[FTP_CONNECT]`);
    ftpStatus = true;
    client.close();
    console.log(`[FTP_DISCONNECT]`);
  } catch (e: any) {
    console.log(`[FTP_ERROR_${e.code || 'STATUS_CHECK'}]: ${e.message}`);
    console.error('FTP Status Check Failed:', e);
  }

  return NextResponse.json({
    database: dbStatus,
    ftp: ftpStatus,
  });
}
