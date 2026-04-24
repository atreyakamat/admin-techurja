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

    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get('eventName');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM registrations WHERE 1=1';
    const values: any[] = [];

    if (eventName) {
      sql += ' AND eventName = ?';
      values.push(eventName);
    }

    if (status) {
      sql += ' AND status = ?';
      values.push(status);
    }

    if (search) {
      sql += ' AND (teamName LIKE ? OR leaderName LIKE ? OR id LIKE ?)';
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY updatedAt DESC LIMIT 1000';

    const results = await query(sql, values);

    return NextResponse.json({
      success: true,
      data: results,
      count: Array.isArray(results) ? results.length : 0,
    });
  } catch (error) {
    console.error('[DB_FETCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    );
  }
}
