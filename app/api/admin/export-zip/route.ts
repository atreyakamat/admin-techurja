import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import JSZip from 'jszip';
import { getRegistrations } from '@/lib/registration-fetcher';
import { Writable } from 'stream';

class BufferWritable extends Writable {
  private chunks: Buffer[] = [];
  
  _write(chunk: Buffer | Uint8Array | string, _encoding: string, callback: (error?: Error | null) => void) {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback();
  }

  getBuffer() {
    return Buffer.concat(this.chunks);
  }
}

async function fetchFileToBuffer(client: ftp.Client, path: string): Promise<Buffer | null> {
  try {
    const writable = new BufferWritable();
    await client.downloadTo(writable, path);
    return writable.getBuffer();
  } catch (error) {
    console.error(`Failed to fetch file: ${path}`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventFilter = searchParams.get('event')?.toLowerCase() || '';

  if (!eventFilter) {
    return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
  }

  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false,
    });

    const registrations = await getRegistrations(client);
    const filteredRegs = registrations.filter((reg: { eventName: string }) => 
      reg.eventName.toLowerCase().includes(eventFilter)
    );

    if (filteredRegs.length === 0) {
      return NextResponse.json({ error: 'No registrations found for this event' }, { status: 404 });
    }

    const zip = new JSZip();
    const eventFolder = zip.folder(eventFilter.replace(/\s+/g, '_'));

    for (const reg of filteredRegs) {
      const regId = reg.id;
      const participantName = (reg.name || 'Unknown').replace(/[\\\/\?\*\[\]]/g, '_');
      const regFolderName = `${regId}_${participantName}`;
      const regFolder = eventFolder?.folder(regFolderName);

      // 1. Fetch details.csv
      const csvPath = `/registrations/${regId}/details.csv`;
      const csvBuffer = await fetchFileToBuffer(client, csvPath);
      if (csvBuffer) {
        regFolder?.file('details.csv', csvBuffer);
      }

      // 2. Fetch Image
      const possibleImgPaths = [
        `/registrations/${regId}/`,
        `/registrations/${regId}/image/`
      ];

      for (const path of possibleImgPaths) {
        try {
          const files = await client.list(path);
          const found = files.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f.name) && !f.isDirectory);
          if (found) {
            const imgBuffer = await fetchFileToBuffer(client, path + found.name);
            if (imgBuffer) {
              regFolder?.file(found.name, imgBuffer);
            }
            break;
          }
        } catch {
          continue;
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const fileName = `event_bundle_${eventFilter.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('ZIP Export API Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    client.close();
  }
}
