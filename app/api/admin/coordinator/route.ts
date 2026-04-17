import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventName = searchParams.get('event');
  const password = searchParams.get('password');

  if (!eventName) {
    return NextResponse.json({ error: 'Event name required' }, { status: 400 });
  }

  // Generate dynamic password: Reversed Event Name
  // e.g., "Innovibe" -> "ebivonnI"
  const expectedPassword = eventName.split('').reverse().join('');

  if (!password || password !== expectedPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const masterPath = '/registrations_master.json';
    
    // FETCH MASTER CACHE
    const chunks: Buffer[] = [];
    const { Writable } = await import('stream');
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });

    await client.downloadTo(writable, masterPath);
    const data = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    
    // FILTER FOR THIS SPECIFIC EVENT
    const registrations = (data.registrations || []).filter((reg: any) => 
      reg.eventName.toLowerCase().trim() === eventName.toLowerCase().trim()
    );

    return NextResponse.json({ 
      eventName,
      count: registrations.length,
      registrations 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'System Busy. Please try again later.' }, { status: 500 });
  } finally {
    client.close();
  }
}
