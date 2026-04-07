import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';

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

async function readCsvFromFtp(client: ftp.Client, path: string): Promise<any | null> {
  try {
    const chunks: Buffer[] = [];
    const { Writable } = await import('stream');
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });
    await client.downloadTo(writable, path);
    const buffer = Buffer.concat(chunks);
    const csvContent = buffer.toString('utf-8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
    return records.length > 0 ? records[0] : null;
  } catch {
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
  const action = searchParams.get('action');
  const folderId = searchParams.get('folder');
  const path = searchParams.get('path') || '/registrations/';

  let client;
  try {
    client = await getFtpClient();

    if (action === 'list-folders') {
      let items: ftp.FileInfo[] = [];
      try {
        items = await client.list(path);
      } catch {
        items = [];
      }

      const folders = items
        .filter(f => f.isDirectory)
        .map(f => ({ name: f.name, size: f.size, modifiedAt: f.modifiedAt?.toISOString() || '' }));

      const files = items
        .filter(f => !f.isDirectory)
        .map(f => ({ name: f.name, size: f.size, modifiedAt: f.modifiedAt?.toISOString() || '' }));

      client.close();
      return NextResponse.json({ folders, files, currentPath: path });
    }

    if (action === 'read-csv' && folderId) {
      const csvPath = `/registrations/${folderId}/details.csv`;
      const csvData = await readCsvFromFtp(client, csvPath);

      let imageFiles: string[] = [];
      try {
        const imageItems = await client.list(`/registrations/${folderId}/image/`);
        imageFiles = imageItems
          .filter(f => !f.isDirectory && /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name))
          .map(f => f.name);
      } catch {
        imageFiles = [];
      }

      client.close();
      return NextResponse.json({
        folderId,
        csvPath,
        csvData,
        csvColumns: csvData ? Object.keys(csvData) : [],
        imageFiles,
        imageFolder: `/registrations/${folderId}/image/`
      });
    }

    if (action === 'read-csv-by-path' && path) {
      const csvData = await readCsvFromFtp(client, path);
      client.close();
      return NextResponse.json({ csvData, csvColumns: csvData ? Object.keys(csvData) : [], csvPath: path });
    }

    if (action === 'read-csv-all' && path) {
      let items: ftp.FileInfo[] = [];
      try {
        items = await client.list(path);
      } catch {
        items = [];
      }

      const csvFiles = items.filter(f => !f.isDirectory && f.name.toLowerCase().endsWith('.csv'));
      const allCsvData: any[] = [];

      for (const csvFile of csvFiles) {
        const fullPath = path.endsWith('/') ? path + csvFile.name : path + '/' + csvFile.name;
        const data = await readCsvFromFtp(client, fullPath);
        if (data) {
          allCsvData.push({
            fileName: csvFile.name,
            filePath: fullPath,
            columns: Object.keys(data),
            data
          });
        }
      }

      client.close();
      return NextResponse.json({ csvFiles: allCsvData, folderPath: path });
    }

    if (action === 'fetch-file' && path) {
      const chunks: Buffer[] = [];
      const { Writable } = await import('stream');
      const writable = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(chunk);
          callback();
        }
      });
      await client.downloadTo(writable, path);
      const buffer = Buffer.concat(chunks);
      client.close();

      const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(path);
      const isCsv = path.toLowerCase().endsWith('.csv');

      if (isImage) {
        const contentType = path.endsWith('.png') ? 'image/png' : path.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        return new Response(buffer, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' }
        });
      }

      if (isCsv) {
        const csvContent = buffer.toString('utf-8');
        const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
        return NextResponse.json({
          csvPath: path,
          columns: records.length > 0 ? Object.keys(records[0] as object) : [],
          rows: records,
          rawText: csvContent
        });
      }

      client.close();
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    client.close();
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    if (client) client.close();
    console.error('FTP Browser API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
