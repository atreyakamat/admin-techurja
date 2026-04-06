import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : new URL(request.url).searchParams.get('token');

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
    });

    const remotePath = `/registrations/${params.id}/`;
    const files = await client.list(remotePath);
    
    // Find the first image file (png, jpg, jpeg, webp)
    const imgFile = files.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f.name));

    if (!imgFile) {
        client.close();
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Download into a buffer and stream it
    // Note: In a production Next.js environment, we might want to pipe directly if possible
    const chunks: any[] = [];
    await client.downloadTo(new WritableStream({
        write(chunk) { chunks.push(chunk); }
    }), remotePath + imgFile.name);

    client.close();

    const buffer = Buffer.concat(chunks);
    const contentType = imgFile.name.endsWith('.png') ? 'image/png' : 'image/jpeg';

    return new Response(buffer, {
      headers: { 'Content-Type': contentType },
    });
  } catch (error: any) {
    client.close();
    console.error('FTP Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
