import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : new URL(request.url).searchParams.get('token');

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new ftp.Client();
  console.log(`[FTP_FETCH_INIT]: {regId: "${id}", fileType: "image"}`);
  
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false, 
    });
    console.log(`[FTP_CONNECT]`);

    const remotePath = `/registrations/${id}/`;
    const files = await client.list(remotePath);
    
    // Find the first image file (png, jpg, jpeg, webp)
    const imgFile = files.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f.name));

    if (!imgFile) {
        console.log(`[FTP_ERROR_404]: Receipt not found for regId ${id}`);
        client.close();
        console.log(`[FTP_DISCONNECT]`);
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Download into a buffer
    const chunks: any[] = [];
    const { Writable } = await import('stream');
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });

    await client.downloadTo(writable, remotePath + imgFile.name);
    
    const buffer = Buffer.concat(chunks);
    console.log(`[FTP_FETCH_SUCCESS]: {regId: "${id}", sizeBytes: ${buffer.length}}`);

    client.close();
    console.log(`[FTP_DISCONNECT]`);

    const contentType = imgFile.name.endsWith('.png') ? 'image/png' : 
                        imgFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    return new Response(buffer, {
      headers: { 
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      },
    });
  } catch (error: any) {
    console.log(`[FTP_ERROR_${error.code || 'UNKNOWN'}]: ${error.message}`);
    client.close();
    console.log(`[FTP_DISCONNECT]`);
    console.error('FTP Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
