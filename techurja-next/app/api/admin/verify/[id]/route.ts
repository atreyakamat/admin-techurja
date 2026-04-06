import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSecret = process.env.ADMIN_SECRET;
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, adminNotes } = await request.json();
    const isApprove = action === 'approve';
    const newStatus = isApprove ? 'verified' : 'rejected';

    const updated = await prisma.registration.update({
      where: { id: BigInt(params.id) },
      data: {
        status: newStatus,
        isAccepted: isApprove ? 1 : 0,
        adminNotes: adminNotes || null,
      },
    });

    return NextResponse.json({
      message: `Registration #${params.id} ${newStatus.toUpperCase()}.`,
      status: updated.status,
    });
  } catch (error: any) {
    console.error('Verify API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
