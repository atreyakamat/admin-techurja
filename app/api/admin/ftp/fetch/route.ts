import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';

export async function GET(
  request: NextRequest
) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : searchParams.get('token');

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  const client = new ftp.Client();
  console.log(`[FTP_FETCH_INIT]: Initiating retrieval for ${id}`);
  
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    const remotePath = `/registrations/${id}/image/`;
    
    // Try to list files in the /image/ directory
    let files: ftp.FileInfo[] = [];
    try {
        files = await client.list(remotePath);
    } catch (e: any) {
        console.log(`[FTP_ERROR_550]: Directory not found for ${id}`);
        client.close();
        return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
    }
    
    // Select the first image file
    const imgFile = files.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f.name));

    if (!imgFile) {
        console.log(`[FTP_ERROR_404]: No image file found in ${remotePath}`);
        client.close();
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
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
    console.log(`[FTP_FETCH_SUCCESS]: File piped successfully (${buffer.length} bytes)`);

    client.close();

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
    console.error('FTP Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
