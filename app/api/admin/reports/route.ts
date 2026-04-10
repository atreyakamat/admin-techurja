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
  const mode = searchParams.get('mode') || 'list';

  if (mode === 'daily-stats') {
    let client;
    try {
      client = await getFtpClient();
      const registrationsPath = '/registrations/';
      let folders: ftp.FileInfo[] = [];
      try {
        folders = await client.list(registrationsPath);
      } catch (e) {
        folders = [];
      }

      const targetFolders = folders.filter(f => f.isDirectory);
      const dailyCounts: Record<string, number> = {};

      // We need to peek into each details.csv to get the date.
      // This is slow, but consistent with how the app currently works.
      const { parse } = await import('csv-parse/sync');

      for (const folder of targetFolders) {
        const folderName = folder.name;
        const csvPath = `${registrationsPath}${folderName}/details.csv`;

        try {
          const chunks: Buffer[] = [];
          const { Writable } = await import('stream');
          const writable = new Writable({
            write(chunk, encoding, callback) {
              chunks.push(chunk);
              callback();
            }
          });

          await client.downloadTo(writable, csvPath);
          const buffer = Buffer.concat(chunks);
          const csvContent = buffer.toString('utf-8');

          const records = parse(csvContent, { skip_empty_lines: true, trim: true, relax_quotes: true });
          let createdAt = '';

          // Find timestamp/date field
          for (const row of records) {
            const key = row[0]?.toLowerCase();
            if (['timestamp', 'createdat', 'date'].includes(key)) {
              createdAt = row[1];
              break;
            }
          }

          if (!createdAt) createdAt = new Date().toISOString();
          const dateStr = new Date(createdAt).toISOString().split('T')[0];
          dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        } catch (e) {
          // Skip if file missing or parse error
        }
      }

      client.close();
      
      const sortedStats = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.date.localeCompare(a.date));

      return NextResponse.json({ dailyStats: sortedStats });
    } catch (error: any) {
      if (client) client.close();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

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
