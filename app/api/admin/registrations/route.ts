import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const isAccepted = searchParams.get('isAccepted') || 'all';
  const event = searchParams.get('event') || '';
  const category = searchParams.get('category') || '';
  const regFrom = searchParams.get('reg_from');
  const regTo = searchParams.get('reg_to');

  try {
    const where: any = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { transactionId: { contains: search } },
        { teamName: { contains: search } },
        { institution: { contains: search } },
      ],
    };

    if (status) where.status = status;
    if (isAccepted !== 'all') where.isAccepted = parseInt(isAccepted);
    if (event) where.eventName = { contains: event };
    if (category) where.event = { category: { contains: category } };
    
    if (regFrom || regTo) {
      where.createdAt = {};
      if (regFrom) where.createdAt.gte = new Date(regFrom);
      if (regTo) where.createdAt.lte = new Date(regTo);
    }

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { event: true },
    });

    const stats = {
      total: await prisma.registration.count(),
      pending: await prisma.registration.count({ where: { status: 'pending' } }),
      verified: await prisma.registration.count({ where: { status: 'verified' } }),
      rejected: await prisma.registration.count({ where: { status: 'rejected' } }),
    };

    // Serialize BigInt for JSON response
    const serialized = registrations.map((reg: any) => ({
      ...reg,
      id: reg.id.toString(),
      eventId: reg.eventId?.toString() || null,
      event: reg.event ? { ...reg.event, id: reg.event.id.toString() } : null,
    }));

    return NextResponse.json({ registrations: serialized, stats });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
