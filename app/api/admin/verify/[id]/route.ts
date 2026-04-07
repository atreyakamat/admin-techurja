import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, adminNotes } = await request.json();
    const isApprove = action === 'approve';
    const newStatus = isApprove ? 'verified' : 'rejected';

    const updated = await prisma.registration.update({
      where: { id: BigInt(id) },
      data: {
        status: newStatus,
        isAccepted: isApprove ? 1 : 0,
        adminNotes: adminNotes || null,
      },
    });

    return NextResponse.json({
      message: `Registration #${id} ${newStatus.toUpperCase()}.`,
      status: updated.status,
    });
  } catch (error: any) {
    console.error('Verify API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
