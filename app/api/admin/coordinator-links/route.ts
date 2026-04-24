import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (token !== adminSecret) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const links = await query('SELECT * FROM coordinator_access ORDER BY eventName ASC');

    return NextResponse.json({
      success: true,
      data: links,
    });
  } catch (error) {
    console.error('[COORDINATOR_LINKS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch coordinator links', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (token !== adminSecret) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const body = await request.json();
    const { eventName, eventSlug, accessLink, password } = body;

    await query(
      'INSERT INTO coordinator_access (eventName, eventSlug, accessLink, password) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE accessLink = VALUES(accessLink), password = VALUES(password)',
      [eventName, eventSlug, accessLink, password]
    );

    return NextResponse.json({
      success: true,
      message: 'Coordinator link added/updated',
    });
  } catch (error) {
    console.error('[COORDINATOR_LINKS_POST_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to add coordinator link', details: String(error) },
      { status: 500 }
    );
  }
}
