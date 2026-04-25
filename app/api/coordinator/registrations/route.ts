import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const eventName = request.nextUrl.searchParams.get('event');
    const eventSlug = request.nextUrl.searchParams.get('slug');
    const search = request.nextUrl.searchParams.get('search');

    if (!eventName && !eventSlug) {
      return NextResponse.json(
        { error: 'Event name or slug required' },
        { status: 400 }
      );
    }

    let sql = 'SELECT * FROM registrations WHERE ';
    const values: any[] = [];

    if (eventName) {
      sql += 'eventName = ?';
      values.push(eventName);
    } else if (eventSlug) {
      sql += 'eventSlug = ?';
      values.push(eventSlug);
    }

    if (search) {
      sql += ' AND (teamName LIKE ? OR leaderName LIKE ? OR leaderEmail LIKE ?)';
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY updatedAt DESC LIMIT 1000';

    const results = await query(sql, values);
    const resultArray = Array.isArray(results) ? results : [];

    return NextResponse.json({
      success: true,
      count: resultArray.length,
      data: resultArray,
    });
  } catch (error) {
    console.error('[COORDINATOR_QUERY_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations', details: String(error) },
      { status: 500 }
    );
  }
}
