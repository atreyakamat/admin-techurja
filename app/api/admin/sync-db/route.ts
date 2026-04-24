import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { syncAllRegistrationsFromFtp } from '@/lib/sync-service';

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

    // Initialize database tables
    await initializeDatabase();

    // Run sync
    const result = await syncAllRegistrationsFromFtp();

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      ...result,
    });
  } catch (error) {
    console.error('[SYNC_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json({
      status: 'ready',
      message: 'Sync endpoint is ready. Send POST to trigger sync.',
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
